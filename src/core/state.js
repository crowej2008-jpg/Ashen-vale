/* ==========================================================================
   src/core/state.js
   The single source of truth for a play session. Everything else (systems,
   UI) reads/mutates AV.state and calls AV.save() to persist.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  const ROSTER_CAP = 1000;

  function freshState() {
    return {
      currencies: {
        gold: 50000,
        summoningScrolls: 3, // "new players get 3 free summons to start battling"
        artifactStones: 5,
        arenaTokens: 20,
        radiantCrystals: 0,
        divineStones: 0,
        heroXpStones: 500,
      },
      player: {
        level: 1,
        xp: 0,
        elo: 1000,
      },
      // Every OWNED COPY of a hero is its own instance/card.
      // heroInstances: { [instanceId]: {templateId, stars, level, xp, equippedArmor:[4], artifactId, orbIds:[8], awakening} }
      heroInstances: {},
      // spare, unattached copies used as evolution/leveling fodder are also heroInstances
      // but with `isFodderOnly` unset — evolution logic just needs copy counts by templateId.
      formation: [null, null, null, null, null, null], // instanceIds, 6 slots
      armorInventory: {}, // pieceInstanceId -> {defKey, piece, equippedOn}
      artifactInventory: {}, // artifactInstanceId -> {templateKey, stars, equippedOn}
      orbInventory: {}, // orbInstanceId -> {setKey, orbDefId, rarity, level, equippedOn, slotIndex}
      heroSouls: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, // by grade
      armorSouls: 0,
      soulStatueLevel: 0,
      awakenings: {}, // instanceId -> tierIndex
      campaign: { highestLevelCleared: 0 },
      bossTower: { highestFloor: 0 },
      endlessTower: { highestFloor: 0 },
      settings: { rosterPinFormation: true },
      orbShop: { lastRefresh: 0, stock: [] },
      log: [],
    };
  }

  AV.ROSTER_CAP = ROSTER_CAP;
  AV.state = null;

  AV.newGame = function newGame() {
    AV.state = freshState();
    // Grant a small opening roster so screens aren't empty on first load.
    const starters = ["h1", "h5", "h11", "h17"];
    starters.forEach((tid) => AV.grantHero(tid));
    AV.state.formation = AV.state.formation.map((_, i) =>
      Object.values(AV.state.heroInstances)[i]?.id ?? null
    );
    AV.save();
  };

  AV.grantHero = function grantHero(templateId) {
    const owned = Object.values(AV.state.heroInstances).length;
    if (owned >= ROSTER_CAP) {
      AV.logEvent(`Roster is full (${ROSTER_CAP}). Cannot add more heroes.`);
      return null;
    }
    const inst = {
      id: AV.uid("hero"),
      templateId,
      stars: 0, // 0 = base copy, up to 10, then ascension ranks tracked separately
      ascensionRank: 0,
      level: 1,
      xp: 0,
      equippedArmor: [null, null, null, null],
      artifactId: null,
      orbIds: new Array(AV.ORB_SLOTS_PER_HERO).fill(null),
      awakeningTier: -1, // -1 = not awakened
      acquiredAt: Date.now(),
    };
    AV.state.heroInstances[inst.id] = inst;
    return inst;
  };

  AV.logEvent = function logEvent(msg) {
    AV.state.log.unshift({ msg, t: Date.now() });
    AV.state.log = AV.state.log.slice(0, 50);
  };

  AV.template = (templateId) => AV.HERO_TEMPLATES.find((h) => h.id === templateId);

  AV.copiesOwned = function copiesOwned(templateId) {
    return Object.values(AV.state.heroInstances).filter((h) => h.templateId === templateId).length;
  };
})(window.AV);
