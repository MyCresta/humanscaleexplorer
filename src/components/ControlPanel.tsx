import {
  mainCategories,
  type CategoryModel,
  type Gender,
  type LocationId,
  type MainCategoryId,
  locations
} from "../model";
import { siteConfig } from "../config/site";
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
  const isLowConfidence = props.selectedCategory.confidence === "low";

  return (
    <section className="panel">
      <h1>{siteConfig.name}</h1>
      <p className="sub">Interactive estimates with linked sources, confidence labels, and 3D scale comparisons.</p>

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
        {isLowConfidence && (
          <div className="confidence-callout">
            Low-confidence category: this estimate is kept in the app for exploration, but it relies on weaker assumptions or proxy data.
          </div>
        )}
        {props.flushComparison && (
          <>
            <div>Comparison ({props.flushComparison.outputLabel}): {formatLiters(props.flushComparison.outputLiters)} ({formatMass(props.flushComparison.outputMassKg)})</div>
            <div>Flush water: {formatLiters(props.flushComparison.flushLiters)} ({formatMass(props.flushComparison.flushMassKg)})</div>
            <div>Flush-to-output ratio: {formatAdaptive(props.flushComparison.flushRatio)}x by volume</div>
          </>
        )}
        {props.selectedCategory.notes && <div>Note: {props.selectedCategory.notes}</div>}
      </div>

      <details className="panel-group methodology" open>
        <summary>Methodology & Confidence</summary>
        <p>
          Estimates combine a base annual value with age, gender, and regional multipliers, then scale that to a lifetime total.
        </p>
        <p>
          The 3D volume is derived from either liquid density or bulk density, so solid materials are shown with packing/air gaps rather than as perfectly compact blocks.
        </p>
        <p>
          Confidence tags indicate how directly the estimate maps to a source. <strong>Low</strong> means the category remains visible, but should be treated as exploratory rather than precise.
        </p>
      </details>
    </section>
  );
}
