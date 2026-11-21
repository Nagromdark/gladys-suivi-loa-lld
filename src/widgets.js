// -----------------------------------------------------------------------------
// Dashboard widget `lease_status` (Gladys 5.1+): the lease at a glance, and the
// "New reading" button whose form records the odometer.
//
// The tiles bound to device features are LIVE (they follow the published
// states); the gauge and the status rows are computed here and served from the
// core cache until the TTL or a requestWidgetRefresh nudge.
// -----------------------------------------------------------------------------

import { createLogger, WIDGET_COLORS } from '@gladysassistant/integration-sdk';
import { WIDGET_KEY } from './lease-service.js';
import { FEATURE, featureExternalId } from './vehicle.js';
import { formatDate, formatEuro, formatKm } from './format.js';

const logger = createLogger({ name: 'widgets' });

export const RECORD_READING_ACTION = 'record_reading';

// Ahead of the even spread by more than this share of the allowance: warn.
const WARNING_MARGIN_PERCENT = 2;

function usageColor(lease) {
  if (lease.allowanceUsedPercent >= 100) {
    return WIDGET_COLORS.DANGER;
  }
  if (lease.allowanceUsedPercent > lease.timeElapsedPercent + WARNING_MARGIN_PERCENT) {
    return WIDGET_COLORS.WARNING;
  }
  return WIDGET_COLORS.SUCCESS;
}

// Green while at or below the even spread, orange once ahead of it (every km
// ahead projects an extra cost), red past the same margin as the gauge.
function deltaColor(config, lease) {
  if (lease.kmDelta === null) {
    return undefined;
  }
  if (lease.kmDelta <= 0) {
    return WIDGET_COLORS.SUCCESS;
  }
  if (lease.kmDelta <= (config.allowance_km * WARNING_MARGIN_PERCENT) / 100) {
    return WIDGET_COLORS.WARNING;
  }
  return WIDGET_COLORS.DANGER;
}

function readingButton(service) {
  const { config } = service;
  return {
    type: 'button',
    label: { en: 'New reading', fr: 'Nouveau relevé' },
    icon: 'edit-3',
    style: 'primary',
    action: {
      key: RECORD_READING_ACTION,
      fields: [
        {
          key: 'km',
          type: 'number',
          required: true,
          min: config.start_km,
          max: 2000000,
          // The last reading pre-fills the form: only the last digits change.
          default: config.reading?.km ?? config.start_km,
          label: { en: 'Odometer (km)', fr: 'Compteur (km)' },
        },
      ],
    },
  };
}

function statusItems(lease, language) {
  const items = [
    {
      label: { en: 'Expected odometer today', fr: "Compteur prévu aujourd'hui" },
      icon: 'target',
      value: formatKm(lease.expectedOdometer, language),
      color: WIDGET_COLORS.NEUTRAL,
    },
  ];
  if (lease.monthlyBudgetKm !== null) {
    items.push({
      label: { en: 'Budget per month', fr: 'Budget par mois' },
      icon: 'calendar',
      value: formatKm(lease.monthlyBudgetKm, language),
      color: WIDGET_COLORS.INFO,
    });
  }
  if (lease.projectedOverageCost !== null) {
    items.push({
      label: { en: 'Projected extra cost', fr: 'Surcoût projeté' },
      icon: 'alert-triangle',
      value: formatEuro(lease.projectedOverageCost, language),
      color: lease.projectedOverageCost > 0 ? WIDGET_COLORS.DANGER : WIDGET_COLORS.SUCCESS,
    });
  }
  items.push({
    label: { en: 'Contract end', fr: 'Fin du contrat' },
    icon: 'flag',
    // The days left ride with the end date: the core keeps 8 components, and
    // their tile gave its slot to the chart.
    value: {
      en: `${formatDate(lease.end, 'en')} (${lease.daysRemaining} d)`,
      fr: `${formatDate(lease.end, 'fr')} (${lease.daysRemaining} j)`,
    },
    color: WIDGET_COLORS.NEUTRAL,
  });
  items.push({
    label: { en: 'Last reading', fr: 'Dernier relevé' },
    icon: 'clock',
    value: lease.reading
      ? formatDate(lease.reading.at, language)
      : { en: 'None yet', fr: 'Aucun pour le moment' },
    color: lease.reading ? WIDGET_COLORS.NEUTRAL : WIDGET_COLORS.WARNING,
  });
  return items;
}

// The contract on one chart: the allowance spread evenly from the delivery to
// the end, and the car's own line (delivery -> last reading -> projected end).
// Inline points rather than the features' history: the chart must span the
// whole contract, future included, and the core's intervals stop at one year.
function leaseChart(config, lease) {
  const point = (date, km) => ({ t: date.toISOString(), v: Math.round(km) });
  const series = [
    {
      name: { en: 'Allowance', fr: 'Forfait' },
      points: [
        point(lease.start, config.start_km),
        point(lease.end, config.start_km + config.allowance_km),
      ],
    },
  ];
  // A reading on the delivery day would draw a vertical segment: no car line.
  if (lease.reading && lease.reading.at > lease.start) {
    const points = [point(lease.start, config.start_km), point(lease.reading.at, lease.odometer)];
    // A reading taken after the end already is the final mileage.
    if (lease.projectedEndOdometer !== null && lease.reading.at < lease.end) {
      points.push(point(lease.end, lease.projectedEndOdometer));
    }
    series.push({ name: { en: 'Your pace', fr: 'Votre rythme' }, points });
  }
  return {
    type: 'chart',
    chart_type: 'line',
    title: { en: 'Odometer vs allowance', fr: 'Compteur et forfait' },
    unit: 'km',
    series,
    now_marker: true,
  };
}

export function buildWidgetContent(gladys, service, { language } = {}) {
  const lease = service.lease();
  if (!lease) {
    const [error] = service.errors();
    return {
      ttl_seconds: 300,
      components: [
        { type: 'text', variant: 'heading', text: service.config.vehicle_name },
        { type: 'text', variant: 'body', text: error },
      ],
    };
  }
  const live = (key, label, icon, color) => ({
    type: 'value',
    label,
    icon,
    device_feature: featureExternalId(gladys, key),
    ...(color ? { color } : {}),
  });
  const components = [
    { type: 'text', variant: 'heading', text: service.config.vehicle_name },
    live(FEATURE.ODOMETER, { en: 'Odometer', fr: 'Compteur' }, 'activity'),
    live(
      FEATURE.KM_DELTA,
      { en: 'Vs expected', fr: 'Écart au prévu' },
      'trending-up',
      deltaColor(service.config, lease),
    ),
    live(FEATURE.PROJECTED_END_ODOMETER, { en: 'Projected end', fr: 'Projection fin' }, 'flag'),
  ];
  if (lease.allowanceUsedPercent !== null) {
    components.push({
      type: 'gauge',
      label: { en: 'Allowance used', fr: 'Forfait consommé' },
      value: Math.max(0, Math.min(100, lease.allowanceUsedPercent)),
      min: 0,
      max: 100,
      unit: '%',
      color: usageColor(lease),
    });
  }
  components.push(leaseChart(service.config, lease));
  components.push({ type: 'status', items: statusItems(lease, language) });
  components.push(readingButton(service));
  // The expected odometer moves ~55 km a day: an hour is fresh enough, and a
  // reading or a config change nudges the widget anyway.
  return { ttl_seconds: 3600, components };
}

export function createWidgets(gladys, service) {
  return {
    [WIDGET_KEY]: {
      async get({ language }) {
        logger.debug(`onWidgetGet <- ${WIDGET_KEY}`);
        return buildWidgetContent(gladys, service, { language });
      },

      async action(actionKey, _params, { values }) {
        logger.info(`onWidgetAction <- ${WIDGET_KEY}.${actionKey}`);
        if (actionKey !== RECORD_READING_ACTION) {
          throw new Error(`Unknown widget action: ${actionKey}`);
        }
        // An older core drops the button `fields` and relays the tap without
        // values: refuse rather than record nothing.
        if (!values || values.km === undefined) {
          throw new Error(
            'Mettez Gladys à jour pour saisir un relevé depuis le widget. / Update Gladys to record a reading from the widget.',
          );
        }
        const lease = await service.recordReading(values.km);
        return {
          en: `Reading recorded: ${formatKm(lease.odometer, 'en')}`,
          fr: `Relevé enregistré : ${formatKm(lease.odometer, 'fr')}`,
        };
      },
    },
  };
}
