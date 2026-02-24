import {
  mainCategories,
  type CategoryModel,
  type Gender,
  type LocationId,
  type MainCategoryId,
  locations
} from "../model";
import { formatAdaptive, formatLiters, formatMass } from "../utils/format";

type ControlPanelProps = {
  age: number;
  gender: Gender;
  location: LocationId;
  mainCategory: MainCategoryId;
  subCategoryId: string;
  subCategoryOptions: CategoryModel[];
  selectedCategory: CategoryModel;
  onAgeChange: (value: number) => void;
  onGenderChange: (value: Gender) => void;
  onLocationChange: (value: LocationId) => void;
  onMainCategoryChange: (value: MainCategoryId) => void;
  onSubCategoryChange: (value: string) => void;
  humanHeightMeters: number;
  humanMassKg: number;
  annualMassKg: number;
  annualLitersVisual: number;
  visualVolumeLiters: number;
  wasteMassKg: number;
  visualVolumeM3: number;
  bulkDensity: number;
  materialDensity: number;
  isLiquid: boolean;
  packingFactor: number;
  annualCount?: number;
  lifetimeCount?: number;
  flushComparison?: {
    outputLabel: string;
    outputMassKg: number;
    outputLiters: number;
    flushMassKg: number;
    flushLiters: number;
    flushRatio: number;
  };
};

export function ControlPanel(props: ControlPanelProps) {
  const confidenceClass = `confidence-tag confidence-${props.selectedCategory.confidence}`;

  return (
    <section className="panel">
      <h1>Human Consumption/Waste Comparator</h1>
      <p className="sub">Source-backed estimates with optional breakdowns per category.</p>

      <section className="panel-group panel-group-controls">
        <h2>Profile</h2>
        <label className="panel-field">
          Age: <strong>{props.age}</strong>
          <input type="range" min={1} max={100} value={props.age} onChange={(e) => props.onAgeChange(Number(e.target.value))} />
        </label>

        <label className="panel-field">
          Gender
          <select value={props.gender} onChange={(e) => props.onGenderChange(e.target.value as Gender)}>
            <option value="unspecified">Unspecified</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </label>

        <label className="panel-field">
          Location
          <select value={props.location} onChange={(e) => props.onLocationChange(e.target.value as LocationId)}>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="panel-group panel-group-controls">
        <h2>Category</h2>
        <label className="panel-field">
          Main Category
          <select value={props.mainCategory} onChange={(e) => props.onMainCategoryChange(e.target.value as MainCategoryId)}>
            {mainCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </label>

        <label className="panel-field">
          Breakdown
          <select value={props.subCategoryId} onChange={(e) => props.onSubCategoryChange(e.target.value)}>
            {props.subCategoryOptions.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.subLabel}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className="stats panel-group">
        <h2>Stats & Info</h2>
        <div>Human: {formatAdaptive(props.humanHeightMeters)} m, {formatMass(props.humanMassKg)}</div>
        {props.lifetimeCount !== undefined && (
          <div>
            Item count: {formatAdaptive(props.annualCount ?? 0)}/year, {formatAdaptive(props.lifetimeCount)} lifetime
          </div>
        )}
        <div>
          Annual estimate: {props.isLiquid ? `${formatLiters(props.annualLitersVisual)} (${formatMass(props.annualMassKg)})` : formatMass(props.annualMassKg)}
        </div>
        <div>
          Lifetime estimate: {props.isLiquid ? `${formatLiters(props.visualVolumeLiters)} (${formatMass(props.wasteMassKg)})` : formatMass(props.wasteMassKg)}
        </div>
        <div>Visual volume: {formatAdaptive(props.visualVolumeM3)} m^3</div>
        <div>Relative density used: {formatAdaptive(props.bulkDensity)} kg/L</div>
        <div>
          {props.isLiquid
            ? "Density note: liquid shown at near-true density (minimal air gaps)."
            : `Density note: bulk material (~${formatAdaptive(props.packingFactor * 100)}% fill vs compact ${formatAdaptive(props.materialDensity)} kg/L).`}
        </div>
        <div>Confidence: <span className={confidenceClass}>{props.selectedCategory.confidence.toUpperCase()}</span></div>
        <div>Source: <a href={props.selectedCategory.sourceUrl} target="_blank" rel="noreferrer">{props.selectedCategory.sourceLabel}</a></div>
        {props.flushComparison && (
          <>
            <div>Comparison ({props.flushComparison.outputLabel}): {formatLiters(props.flushComparison.outputLiters)} ({formatMass(props.flushComparison.outputMassKg)})</div>
            <div>Flush water: {formatLiters(props.flushComparison.flushLiters)} ({formatMass(props.flushComparison.flushMassKg)})</div>
            <div>Flush-to-output ratio: {formatAdaptive(props.flushComparison.flushRatio)}x by volume</div>
          </>
        )}
        {props.selectedCategory.notes && <div>Note: {props.selectedCategory.notes}</div>}
      </div>
    </section>
  );
}
