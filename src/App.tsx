import { useEffect, useMemo, useState } from "react";
import {
  averageHeightsByLocation,
  estimateCategoryValue,
  findCategoryById,
  getDefaultCategory,
  getMainCategoryLabel,
  getSubCategories,
  type CategoryModel,
  type Gender,
  type LocationId,
  type MainCategoryId,
  toLiters,
  toKilograms
} from "./model";
import { ControlPanel } from "./components/ControlPanel";
import { HumanAndWasteScene, type SceneBackground, type WasteRenderMode } from "./components/HumanAndWasteScene";
import { formatAdaptive } from "./utils/format";

function App() {
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState<Gender>("unspecified");
  const [location, setLocation] = useState<LocationId>("Global");
  const [mainCategory, setMainCategory] = useState<MainCategoryId>("municipal_waste");
  const [subCategoryId, setSubCategoryId] = useState<string>(() => getDefaultCategory("municipal_waste").id);
  const [sceneBackground, setSceneBackground] = useState<SceneBackground>("gym_hall");

  const subCategoryOptions = useMemo(() => getSubCategories(mainCategory), [mainCategory]);

  useEffect(() => {
    const exists = subCategoryOptions.some((c) => c.id === subCategoryId);
    if (!exists && subCategoryOptions.length > 0) {
      setSubCategoryId(getDefaultCategory(mainCategory).id);
    }
  }, [mainCategory, subCategoryId, subCategoryOptions]);

  const selectedCategory = useMemo(() => {
    const chosen = findCategoryById(subCategoryId);
    if (chosen && chosen.mainCategory === mainCategory) return chosen;
    return getDefaultCategory(mainCategory);
  }, [mainCategory, subCategoryId]);

  const estimate = useMemo(
    () => estimateCategoryValue({ age, gender, location, category: selectedCategory }),
    [age, gender, location, selectedCategory]
  );

  const computeVisual = (category: CategoryModel, lifetimeEstimate: number) => {
    const kgPerUnit = category.itemMassKg;
    const materialDensity = category.kgPerLiter ?? 1;
    const bulkDensity = category.bulkKgPerLiter ?? materialDensity;
    const count = category.unit === "count" ? lifetimeEstimate : undefined;
    const massKg = toKilograms(lifetimeEstimate, category.unit, materialDensity, kgPerUnit);
    const liters = toLiters(lifetimeEstimate, category.unit, materialDensity, kgPerUnit);
    const countBasedGeometricVolumeM3 =
      count !== undefined && category.itemRadiusMeters && category.itemHeightMeters
        ? Math.max(
            0.0001,
            count *
              Math.PI *
              (Math.pow(category.itemRadiusMeters, 2) - Math.pow(category.itemInnerRadiusMeters ?? 0, 2)) *
              category.itemHeightMeters
          )
        : undefined;
    const visualVolumeM3 = countBasedGeometricVolumeM3 ?? (massKg / bulkDensity) / 1000;
    const visualVolumeLiters = visualVolumeM3 * 1000;
    const volumeM3 = Math.max(visualVolumeM3, 0.0001);
    const sideMeters = Math.cbrt(volumeM3);
    const isLiquid = category.materialState === "liquid" || category.unit === "L";
    const hasInstancedPile = category.unit === "count" && !!category.itemRadiusMeters && !!category.itemHeightMeters;
    const mode: WasteRenderMode = hasInstancedPile
      ? "instanced_pile"
      : isLiquid
        ? "liquid_fill"
        : category.subCategory === "feces"
          ? "feces_pour"
          : "cube";

    const coneHeightFactor = 0.58;
    const fecesHeightMeters = Math.cbrt((3 * volumeM3) / (Math.PI * coneHeightFactor * coneHeightFactor));
    const fecesRadiusMeters = coneHeightFactor * fecesHeightMeters;
    const liquidRadiusMeters = Math.cbrt(volumeM3 / (2 * Math.PI));
    const liquidHeightMeters = liquidRadiusMeters * 2;
    const itemRadiusMeters = category.itemRadiusMeters ?? 0.03;
    const itemHeightMeters = category.itemHeightMeters ?? 0.1;
    const itemInnerRadiusMeters = category.itemInnerRadiusMeters ?? 0;
    const maxVisualItems = category.maxVisualItems ?? 1200;
    const itemStackStyle = category.itemStackStyle ?? "pyramid";
    const fullCount = Math.max(1, Math.floor(count ?? 1));
    const tetrahedral = (n: number) => (n * (n + 1) * (n + 2)) / 6;
    let baseSide = 1;
    while (tetrahedral(baseSide) < fullCount) baseSide += 1;
    let remainingItems = fullCount;
    let usedLayers = 0;
    for (let side = baseSide; side > 0 && remainingItems > 0; side -= 1) {
      const layerCap = (side * (side + 1)) / 2;
      remainingItems -= layerCap;
      usedLayers += 1;
    }
    const horizontalGap = itemRadiusMeters * 2 * 1.06;
    const verticalGap = itemHeightMeters * 1.02;
    let pileHeightMeters = mode === "instanced_pile"
      ? Math.max(itemHeightMeters, (usedLayers - 1) * verticalGap + itemHeightMeters)
      : 0;
    let pileRadiusMeters = mode === "instanced_pile"
      ? Math.max(itemRadiusMeters * 1.2, (Math.max(baseSide - 1, 1) * horizontalGap * 0.8) + itemRadiusMeters * 0.5)
      : 0;
    if (mode === "instanced_pile" && itemStackStyle === "chips_columns") {
      const stackGap = itemRadiusMeters * 2.35;
      const stackVerticalGap = itemHeightMeters * 1.01;
      const stackCaps: number[] = [];
      let remaining = fullCount;
      let stackIndex = 0;
      while (remaining > 0) {
        const cap = 10 + ((stackIndex * 7) % 21);
        const used = Math.min(cap, remaining);
        stackCaps.push(used);
        remaining -= used;
        stackIndex += 1;
      }
      const stackCount = Math.max(1, stackCaps.length);
      const cols = Math.max(1, Math.ceil(Math.sqrt(stackCount)));
      const rows = Math.ceil(stackCount / cols);
      const maxStackItems = Math.max(...stackCaps);
      pileHeightMeters = Math.max(itemHeightMeters, (maxStackItems - 1) * stackVerticalGap + itemHeightMeters);
      pileRadiusMeters = Math.max(
        itemRadiusMeters * 1.2,
        ((Math.max(cols, rows) - 1) * stackGap) / 2 + itemRadiusMeters
      );
    }
    const heightMeters =
      mode === "liquid_fill"
        ? liquidHeightMeters
        : mode === "feces_pour"
          ? fecesHeightMeters
          : mode === "instanced_pile"
            ? pileHeightMeters
            : sideMeters;
    const halfWidthMeters =
      mode === "liquid_fill"
        ? liquidRadiusMeters
        : mode === "feces_pour"
          ? fecesRadiusMeters
          : mode === "instanced_pile"
            ? pileRadiusMeters
            : sideMeters / 2;

    return {
      materialDensity,
      bulkDensity,
      massKg,
      liters,
      count,
      visualVolumeLiters,
      visualVolumeM3,
      sideMeters,
      isLiquid,
      mode,
      heightMeters,
      halfWidthMeters,
      itemRadiusMeters,
      itemHeightMeters,
        itemInnerRadiusMeters,
        maxVisualItems,
      itemSurface: category.itemSurface ?? "aluminum",
      itemColor: category.itemColor ?? category.color,
      itemLabelBandColor: category.itemLabelBandColor ?? "#cc3b3b",
      itemStackStyle,
      isRenderOptimized: (count ?? 0) > maxVisualItems
    };
  };

  const isFlushComparison = selectedCategory.mainCategory === "sanitation_flush";
  const outputCategoryId = selectedCategory.subCategory === "feces_flush" ? "body_feces" : "body_urine";
  const outputCategory = isFlushComparison ? findCategoryById(outputCategoryId) : undefined;
  const outputEstimate = outputCategory
    ? estimateCategoryValue({ age, gender, location, category: outputCategory })
    : undefined;

  const primaryEstimate = isFlushComparison && outputEstimate ? outputEstimate : estimate;
  const primaryVisual = computeVisual(primaryEstimate.category, primaryEstimate.lifetimeEstimate);
  const selectedVisual = computeVisual(estimate.category, estimate.lifetimeEstimate);
  const secondaryVisual = isFlushComparison
    ? selectedVisual
    : undefined;

  const humanHeightMeters = averageHeightsByLocation[location][gender];
  const humanMassKg = gender === "male" ? 78 : gender === "female" ? 64 : 71;
  const tallestWaste = secondaryVisual
    ? Math.max(primaryVisual.heightMeters, secondaryVisual.heightMeters)
    : primaryVisual.heightMeters;
  const sceneExtent = Math.max(2.8, Math.max(humanHeightMeters, tallestWaste) * 2.2);
  const annualMassKg = toKilograms(
    estimate.annual,
    estimate.category.unit,
    estimate.category.kgPerLiter ?? 1,
    estimate.category.itemMassKg
  );
  const annualLitersVisual = annualMassKg / (estimate.category.bulkKgPerLiter ?? estimate.category.kgPerLiter ?? 1);
  const packingFactor = (estimate.category.bulkKgPerLiter ?? 1) / (estimate.category.kgPerLiter ?? 1);
  const animationToken = `${selectedCategory.id}-${primaryVisual.heightMeters.toFixed(3)}-${secondaryVisual?.heightMeters?.toFixed(3) ?? "single"}`;

  const flushComparisonData =
    isFlushComparison && outputEstimate && secondaryVisual
      ? {
          outputLabel: outputEstimate.category.subLabel,
          outputMassKg: primaryVisual.massKg,
          outputLiters: primaryVisual.liters,
          flushMassKg: secondaryVisual.massKg,
          flushLiters: secondaryVisual.liters,
          flushRatio: secondaryVisual.liters / Math.max(primaryVisual.liters, 0.0001)
        }
      : undefined;

  return (
    <main className="app">
      <ControlPanel
        age={age}
        gender={gender}
        location={location}
        mainCategory={mainCategory}
        subCategoryId={selectedCategory.id}
        subCategoryOptions={subCategoryOptions}
        selectedCategory={selectedCategory}
        onAgeChange={setAge}
        onGenderChange={setGender}
        onLocationChange={setLocation}
        onMainCategoryChange={setMainCategory}
        onSubCategoryChange={setSubCategoryId}
        humanHeightMeters={humanHeightMeters}
        humanMassKg={humanMassKg}
        annualMassKg={annualMassKg}
        annualLitersVisual={annualLitersVisual}
        visualVolumeLiters={selectedVisual.visualVolumeLiters}
        wasteMassKg={selectedVisual.massKg}
        visualVolumeM3={selectedVisual.visualVolumeM3}
        bulkDensity={estimate.category.bulkKgPerLiter ?? estimate.category.kgPerLiter ?? 1}
        materialDensity={estimate.category.kgPerLiter ?? 1}
        isLiquid={estimate.category.materialState === "liquid" || estimate.category.unit === "L"}
        packingFactor={packingFactor}
        flushComparison={flushComparisonData}
        annualCount={estimate.category.unit === "count" ? estimate.annual : undefined}
        lifetimeCount={estimate.category.unit === "count" ? estimate.lifetimeEstimate : undefined}
      />

      <section className="viz" aria-label="3D comparison visualization">
        <div className="canvas-wrap">
          <div className="viz-header">
            <span className="scene-pill">Human ({formatAdaptive(humanHeightMeters)} m)</span>
            <span className="scene-pill">{getMainCategoryLabel(mainCategory)} / {selectedCategory.subLabel}</span>
            <label className="scene-bg-picker">
              <span>Scene</span>
              <select value={sceneBackground} onChange={(e) => setSceneBackground(e.target.value as SceneBackground)}>
                <option value="gym_hall">Gym</option>
                <option value="studio">Studio</option>
                <option value="minimal">Minimal</option>
              </select>
            </label>
          </div>
          <HumanAndWasteScene
            wasteSideMeters={primaryVisual.sideMeters}
            wasteHeightMeters={primaryVisual.heightMeters}
            wasteHalfWidthMeters={primaryVisual.halfWidthMeters}
            wasteColor={primaryEstimate.category.color}
            wasteMassKg={primaryVisual.massKg}
            wasteLiters={primaryVisual.liters}
            isLiquid={primaryVisual.isLiquid}
            humanHeightMeters={humanHeightMeters}
            humanMassKg={humanMassKg}
            sceneExtent={sceneExtent}
            backgroundPreset={sceneBackground}
            wasteMode={primaryVisual.mode}
            animationToken={animationToken}
            secondaryWaste={
              secondaryVisual
                ? {
                    sideMeters: secondaryVisual.sideMeters,
                    heightMeters: secondaryVisual.heightMeters,
                    halfWidthMeters: secondaryVisual.halfWidthMeters,
                    color: estimate.category.color,
                    massKg: secondaryVisual.massKg,
                    liters: secondaryVisual.liters,
                    isLiquid: secondaryVisual.isLiquid,
                    mode: secondaryVisual.mode,
                    count: secondaryVisual.count,
                    itemRadiusMeters: secondaryVisual.itemRadiusMeters,
                    itemHeightMeters: secondaryVisual.itemHeightMeters,
                    itemInnerRadiusMeters: secondaryVisual.itemInnerRadiusMeters,
                    maxVisualItems: secondaryVisual.maxVisualItems,
                    itemSurface: secondaryVisual.itemSurface,
                    itemColor: secondaryVisual.itemColor,
                    itemLabelBandColor: secondaryVisual.itemLabelBandColor,
                    itemStackStyle: secondaryVisual.itemStackStyle,
                    itemLabel: estimate.category.subLabel
                  }
                : undefined
            }
            wasteCount={primaryVisual.count}
            wasteItemRadiusMeters={primaryVisual.itemRadiusMeters}
            wasteItemHeightMeters={primaryVisual.itemHeightMeters}
            wasteItemInnerRadiusMeters={primaryVisual.itemInnerRadiusMeters}
            wasteMaxVisualItems={primaryVisual.maxVisualItems}
            wasteItemSurface={primaryVisual.itemSurface}
            wasteItemColor={primaryVisual.itemColor}
            wasteItemLabelBandColor={primaryVisual.itemLabelBandColor}
            wasteItemStackStyle={primaryVisual.itemStackStyle}
            wasteItemLabel={primaryEstimate.category.subLabel}
          />
        </div>
      </section>
    </main>
  );
}

export default App;
