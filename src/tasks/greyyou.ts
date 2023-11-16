import { CombatStrategy, step } from "grimoire-kolmafia";
import {
  availableAmount,
  buy,
  buyUsingStorage,
  cliExecute,
  closetAmount,
  drink,
  Effect,
  equip,
  getClanName,
  getWorkshed,
  haveEquipped,
  hippyStoneBroken,
  inebrietyLimit,
  itemAmount,
  myAdventures,
  myAscensions,
  myDaycount,
  myInebriety,
  myLevel,
  myMaxhp,
  mySign,
  numericModifier,
  print,
  pullsRemaining,
  putCloset,
  pvpAttacksLeft,
  restoreHp,
  restoreMp,
  retrieveItem,
  storageAmount,
  takeCloset,
  toInt,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
  wait,
} from "kolmafia";
import {
  $coinmaster,
  $effect,
  $effects,
  $familiar,
  $familiars,
  $item,
  $items,
  $location,
  $skill,
  get,
  getTodaysHolidayWanderers,
  have,
  Macro,
  set,
  uneffect,
} from "libram";
import { args } from "../args";
import { getCurrentLeg, Leg, Quest } from "./structure";
import {
  backstageItemsDone,
  bestFam,
  canDiet,
  doneAdventuring,
  getGarden,
  haveAll,
  maxBase,
  stooperDrunk,
  totallyDrunk,
} from "./utils";

function firstWorkshed() {
  return (
    $items`model train set, Asdon Martin keyfob, cold medicine cabinet, Little Geneticist DNA-Splicing Lab, portable Mayo Clinic`.find(
      (it) => have(it) || getWorkshed() === it || storageAmount(it) > 0
    ) || $item`none`
  );
}
function altWorkshed() {
  const ws = getWorkshed();
  switch (ws) {
    case $item`model train set`:
      return (
        $items`cold medicine cabinet, Asdon Martin keyfob, Little Geneticist DNA-Splicing Lab, portable Mayo Clinic`.find(
          (it) => have(it) || getWorkshed() === it || storageAmount(it) > 0
        ) || ws
      );
    case $item`Asdon Martin keyfob`:
      return (
        $items`cold medicine cabinet, model train set, Little Geneticist DNA-Splicing Lab, portable Mayo Clinic`.find(
          (it) => have(it) || getWorkshed() === it || storageAmount(it) > 0
        ) || ws
      );
    case $item`cold medicine cabinet`:
      return (
        $items`Asdon Martin keyfob, model train set, Little Geneticist DNA-Splicing Lab, portable Mayo Clinic, warbear induction oven, snow machine`.find(
          (it) => have(it) || getWorkshed() === it || storageAmount(it) > 0
        ) || ws
      );
    case $item`Little Geneticist DNA-Splicing Lab`:
      return (
        $items`cold medicine cabinet, Asdon Martin keyfob, model train set, portable Mayo Clinic`.find(
          (it) => have(it) || getWorkshed() === it || storageAmount(it) > 0
        ) || ws
      );
    case $item`portable Mayo Clinic`:
      return (
        $items`cold medicine cabinet, model train set, Asdon Martin keyfob, Little Geneticist DNA-Splicing Lab`.find(
          (it) => have(it) || getWorkshed() === it || storageAmount(it) > 0
        ) || ws
      );
    default:
      return $item`none`;
  }
}

export function GyouQuests(): Quest[] {
  return [
    {
      name: "Smol Run",
      completed: () =>
        getCurrentLeg() !== Leg.Smol || step("questL13Final") > 11 || get("kingLiberated", false),
      tasks: [
        {
          name: "Whitelist VIP Clan",
          completed: () => !args.clan || getClanName().toLowerCase() === args.clan.toLowerCase(),
          do: () => cliExecute(`/whitelist ${args.clan}`),
        },
        {
          name: "Prep Fireworks Shop",
          completed: () =>
            !have($item`Clan VIP Lounge key`) || get("_goorboFireworksPrepped", false),
          do: () => {
            visitUrl("clan_viplounge.php?action=fwshop&whichfloor=2");
            set("_goorboFireworksPrepped", true);
          },
        },
        {
          name: "Pre-Pulls",
          completed: () =>
            pullsRemaining() === 0 ||
            !args.pulls.find(
              (it) => !have(it) && !get("_roninStoragePulls").includes(toInt(it).toString())
            ), //can't find a pull that (we dont have and it hasn't been pulled today)
          do: () =>
            args.pulls.forEach((it) => {
              if (!have(it) && !get("_roninStoragePulls").includes(toInt(it).toString())) {
                if (storageAmount(it) === 0) buyUsingStorage(it); //should respect autoBuyPriceLimit
                cliExecute(`pull ${it}`);
              }
            }),
        },
        {
          name: "LGR Seed",
          ready: () =>
            have($item`lucky gold ring`) && have($item`one-day ticket to Dinseylandfill`),
          completed: () => get("_stenchAirportToday") || get("stenchAirportAlways"),
          do: () => use($item`one-day ticket to Dinseylandfill`),
          tracking: "Garbo",
        },
        {
          name: "Install First Workshed",
          ready: () => have(firstWorkshed()),
          completed: () =>
            firstWorkshed() === $item`none` ||
            get("_workshedItemUsed") ||
            getWorkshed() !== $item`none`,
          do: () => use(firstWorkshed()),
        },
        {
          name: "SIT Course",
          // eslint-disable-next-line libram/verify-constants
          ready: () => have($item`S.I.T. Course Completion Certificate`),
          completed: () => get("_sitCourseCompleted", false),
          choices: {
            1494: 2,
          },
          do: () =>
            // eslint-disable-next-line libram/verify-constants
            use($item`S.I.T. Course Completion Certificate`),
        },
        {
          name: "Break Stone",
          completed: () => hippyStoneBroken() || !args.pvp,
          do: (): void => {
            visitUrl("peevpee.php?action=smashstone&pwd&confirm=on", true);
            visitUrl("peevpee.php?place=fight");
          },
        },
        {
          name: "Stillsuit Prep",
          completed: () => itemAmount($item`tiny stillsuit`) === 0,
          do: () =>
            equip(
              $item`tiny stillsuit`,
              get(
                "stillsuitFamiliar",
                $familiars`Gelatinous Cubeling, Levitating Potato, Mosquito`.find((fam) =>
                  have(fam)
                ) || $familiar`none`
              )
            ),
        },
        {
          name: "Run",
          completed: () => step("questL13Final") > 11,
          do: () => cliExecute(args.smolscript),
          clear: "all",
          tracking: "Run",
        },
      ],
    },
    {
      name: "Post-Grey You Aftercore",
      ready: () => myDaycount() === 1 && get("kingLiberated", false),
      completed: () => getCurrentLeg() !== Leg.Smol,
      tasks: [
        {
          name: "Drink Pre-Tune",
          ready: () =>
            mySign().toLowerCase() === "blender" &&
            myLevel() >= 7 &&
            have($item`mime army shotglass`) &&
            (have($item`astral pilsner`) || have($item`astral six-pack`)),
          completed: () =>
            get("_mimeArmyShotglassUsed") || !have($item`hewn moon-rune spoon`) || get("moonTuned"),
          prepare: () => {
            if (have($item`astral six-pack`)) use($item`astral six-pack`);
          },
          do: () => drink(1, $item`astral pilsner`),
        },
        {
          name: "Moon Spoon",
          completed: () =>
            !have($item`hewn moon-rune spoon`) ||
            get("moonTuned") ||
            mySign().toLowerCase() === "wombat",
          do: () => cliExecute("spoon wombat"),
        },
        {
          name: "Install Alternate Workshed",
          ready: () => have(altWorkshed()),
          completed: () =>
            altWorkshed() === $item`none` ||
            get("_workshedItemUsed") ||
            getWorkshed() === altWorkshed(),
          do: () => use(altWorkshed()),
        },
        {
          name: "Gold Wedding Ring",
          completed: () =>
            !have($skill`Comprehensive Cartography`) ||
            myAscensions() === get("lastCartographyBooPeak"),
          choices: { 1430: 3, 606: 4, 610: 1, 1056: 1 },
          do: $location`A-Boo Peak`,
          outfit: { modifier: "initiative 40 min 40 max, -tie" },
        },
        {
          name: "Breakfast",
          completed: () => get("breakfastCompleted"),
          do: () => cliExecute("breakfast"),
        },
        {
          name: "Daily Dungeon",
          completed: () => get("dailyDungeonDone"),
          acquire:
            $items`eleven-foot pole, Pick-O-Matic lockpicks, ring of Detect Boring Doors`.map(
              (it) => ({ item: it, price: 1000 })
            ),
          outfit: () => {
            return {
              familiar: bestFam(),
              ...(get("_lastDailyDungeonRoom") % 5 === 4
                ? { acc1: $item`ring of Detect Boring Doors` }
                : {}),
              modifier: `${maxBase()}, 250 bonus carnivorous potted plant, 100 familiar experience`,
            };
          },
          prepare: (): void => {
            if (
              !get("_dailyDungeonMalwareUsed") &&
              itemAmount($item`fat loot token`) < 3 &&
              itemAmount($item`daily dungeon malware`) === 0
            ) {
              if (
                availableAmount($item`BACON`) >= 150 &&
                !get("_internetDailyDungeonMalwareBought")
              ) {
                retrieveItem(150, $item`BACON`);
                buy($coinmaster`internet meme shop`, 1, $item`daily dungeon malware`);
              } else retrieveItem(1, $item`daily dungeon malware`);
            }
            restoreHp(0.75 * myMaxhp());
            restoreMp(20);
          },
          do: $location`The Daily Dungeon`,
          choices: {
            692: 3, //dd door: lockpicks
            689: 1, //dd final chest : open
            690: 2, //dd chest 1: boring door
            691: 2, //dd chest 2: boring door
            693: 2, //dd trap: skip
          },
          combat: new CombatStrategy()
            .macro(Macro.skill($skill`Infinite Loop`), getTodaysHolidayWanderers())
            .macro(() =>
              Macro.externalIf(
                !get("_dailyDungeonMalwareUsed"),
                Macro.tryItem($item`daily dungeon malware`)
              )
                .tryItem($item`train whistle`)
                .tryItem($item`porquoise-handled sixgun`)
                .attack()
                .repeat()
            ),
          limit: { tries: 15 },
        },
        {
          name: "Laugh Floor",
          completed: () =>
            args.ascend ||
            have($skill`Liver of Steel`) ||
            have($item`steel margarita`) ||
            have($item`Azazel's lollipop`) ||
            have($item`observational glasses`),
          effects: () => [
            ...(have($skill`Musk of the Moose`) ? $effects`Musk of the Moose` : []),
            ...(have($skill`Carlweather's Cantata of Confrontation`)
              ? $effects`Carlweather's Cantata of Confrontation`
              : []),
          ],
          prepare: (): void => {
            if (args.buffy && !have($effect`Carlweather's Cantata of Confrontation`)) {
              cliExecute("kmail to Buffy || 10 Cantata of Confrontation");
              wait(15);
              cliExecute("refresh effects");
            }
            $effects`Smooth Movements, The Sonata of Sneakiness, Darkened Photons, Shifted Phase`.forEach(
              (ef: Effect) => cliExecute(`uneffect ${ef}`)
            );
            restoreHp(0.75 * myMaxhp());
            restoreMp(20);
          },
          do: $location`The Laugh Floor`,
          outfit: () => ({
            familiar: bestFam(),
            modifier: `${maxBase()}, 100 combat rate, 3 item, 250 bonus carnivorous potted plant`,
          }),
          combat: new CombatStrategy().macro(
            Macro.trySkill($skill`Curse of Weaksauce`)
              .tryItem($item`train whistle`)
              .tryItem($item`porquoise-handled sixgun`)
              .attack()
              .repeat()
          ),
          limit: { tries: 15 },
        },
        {
          name: "Infernal Rackets Backstage",
          completed: () =>
            args.ascend ||
            have($skill`Liver of Steel`) ||
            have($item`steel margarita`) ||
            have($item`Azazel's unicorn`) ||
            backstageItemsDone(),
          effects: () => [
            ...(have($skill`Smooth Movement`) ? $effects`Smooth Movements` : []),
            ...(have($skill`The Sonata of Sneakiness`) ? $effects`The Sonata of Sneakiness` : []),
          ],
          prepare: (): void => {
            if (args.buffy && !have($effect`The Sonata of Sneakiness`)) {
              cliExecute("kmail to Buffy || 10 Sonata of Sneakiness");
              wait(15);
              cliExecute("refresh effects");
            }
            $effects`Musk of the Moose, Carlweather's Cantata of Confrontation, Hooooooooonk!`.forEach(
              (ef: Effect) => cliExecute(`uneffect ${ef}`)
            );
            restoreHp(0.75 * myMaxhp());
            restoreMp(20);
          },
          do: $location`Infernal Rackets Backstage`,
          outfit: () => ({
            familiar: bestFam(),
            modifier: `${maxBase()}, -100 combat rate, 3 item, 250 bonus carnivorous potted plant`,
          }),
          combat: new CombatStrategy().macro(
            Macro.trySkill($skill`Curse of Weaksauce`)
              .tryItem($item`train whistle`)
              .tryItem($item`porquoise-handled sixgun`)
              .attack()
              .repeat()
          ),
          limit: { tries: 15 },
        },
        {
          name: "Mourn",
          ready: () => have($item`observational glasses`),
          completed: () =>
            args.ascend ||
            have($skill`Liver of Steel`) ||
            have($item`steel margarita`) ||
            have($item`Azazel's lollipop`),
          outfit: {
            equip: $items`hilarious comedy prop, observational glasses, Victor\, the Insult Comic Hellhound Puppet`,
          },
          do: () => cliExecute("panda comedy insult; panda comedy observe"),
        },
        {
          name: "Sven Golly",
          ready: () => backstageItemsDone(),
          completed: () =>
            args.ascend ||
            have($skill`Liver of Steel`) ||
            have($item`steel margarita`) ||
            have($item`Azazel's unicorn`),
          do: (): void => {
            cliExecute(
              `panda arena Bognort ${$items`giant marshmallow, gin-soaked blotter paper`.find((a) =>
                have(a)
              )}`
            );
            cliExecute(
              `panda arena Stinkface ${$items`beer-scented teddy bear, gin-soaked blotter paper`.find(
                (a) => have(a)
              )}`
            );
            cliExecute(
              `panda arena Flargwurm ${$items`booze-soaked cherry, sponge cake`.find((a) =>
                have(a)
              )}`
            );
            cliExecute(`panda arena Jim ${$items`comfy pillow, sponge cake`.find((a) => have(a))}`);
          },
        },
        {
          name: "Moaning Panda",
          ready: () => haveAll($items`Azazel's lollipop, Azazel's unicorn`),
          completed: () =>
            args.ascend ||
            have($skill`Liver of Steel`) ||
            have($item`steel margarita`) ||
            have($item`Azazel's tutu`),
          acquire: () =>
            $items`bus pass, imp air`.map((it) => ({
              item: it,
              num: 5,
              price: get("valueOfAdventure"),
            })),
          do: () => cliExecute("panda moan"),
          limit: { tries: 3 },
        },
        {
          name: "Steel Margarita",
          ready: () => haveAll($items`Azazel's tutu, Azazel's lollipop, Azazel's unicorn`),
          completed: () =>
            args.ascend || have($skill`Liver of Steel`) || have($item`steel margarita`),
          do: () => cliExecute("panda temple"),
        },
        {
          name: "Liver of Steel",
          ready: () => have($item`steel margarita`),
          completed: () => args.ascend || have($skill`Liver of Steel`),
          do: () => drink(1, $item`steel margarita`),
        },
        {
          name: "Garbo",
          ready: () => get("_stenchAirportToday") || get("stenchAirportAlways"),
          completed: () => (myAdventures() === 0 && !canDiet()) || stooperDrunk(),
          prepare: () => uneffect($effect`Beaten Up`),
          do: () => cliExecute(args.garbo),
          post: () =>
            $effects`Power Ballad of the Arrowsmith, Stevedave's Shanty of Superiority, The Moxious Madrigal, The Magical Mojomuscular Melody, Aloysius' Antiphon of Aptitude, Ur-Kel's Aria of Annoyance`
              .filter((ef) => have(ef))
              .forEach((ef) => uneffect(ef)),
          clear: "all",
          tracking: "Garbo",
        },
        {
          name: "Turn in FunFunds",
          ready: () => get("_stenchAirportToday") && itemAmount($item`FunFunds™`) >= 20,
          completed: () => have($item`one-day ticket to Dinseylandfill`),
          do: () =>
            buy($coinmaster`The Dinsey Company Store`, 1, $item`one-day ticket to Dinseylandfill`),
          tracking: "Garbo",
        },
        {
          name: "PvP",
          ready: () => doneAdventuring(),
          completed: () => pvpAttacksLeft() === 0 || !hippyStoneBroken(),
          do: (): void => {
            cliExecute("unequip");
            cliExecute("UberPvPOptimizer");
            cliExecute("swagger");
          },
        },
        {
          name: "Stooper",
          ready: () =>
            myInebriety() === inebrietyLimit() &&
            have($item`tiny stillsuit`) &&
            get("familiarSweat") >= 300,
          completed: () => !have($familiar`Stooper`) || stooperDrunk(),
          do: () => {
            useFamiliar($familiar`Stooper`);
            cliExecute("drink stillsuit distillate");
          },
        },
        {
          name: "Nightcap",
          ready: () => doneAdventuring(),
          completed: () => args.ascend || totallyDrunk(),
          do: () => cliExecute("CONSUME NIGHTCAP"),
        },
        {
          name: "Barfing Drunk with Stooper",
          ready: () =>
            stooperDrunk() && have($familiar`Stooper`) && !have($item`Drunkula's wineglass`),
          completed: () => !args.ascend || myAdventures() === 0 || totallyDrunk(),
          acquire: [{ item: $item`seal tooth` }],
          outfit: () => ({
            familiar: $familiar`Stooper`,
            modifier: `${maxBase()}, 2.5 meat, 0.6 items`,
          }),
          effects: $effects`How to Scam Tourists`, //need to add meat buffs that we can cast
          prepare: (): void => {
            restoreHp(0.75 * myMaxhp());
            restoreMp(20);
          },
          do: $location`Barf Mountain`,
          combat: new CombatStrategy()
            .macro(Macro.trySkill($skill`Curse of Weaksauce`), getTodaysHolidayWanderers())
            .macro(() =>
              Macro.step("pickpocket")
                .tryItem($item`train whistle`)
                .trySkill($skill`Bowl Straight Up`)
                .trySkill($skill`Sing Along`)
                .tryItem($item`porquoise-handled sixgun`)
                .externalIf(
                  haveEquipped($item`mafia pointer finger ring`),
                  Macro.trySkill($skill`Furious Wallop`)
                    .trySkill($skill`Summer Siesta`)
                    .trySkill($skill`Throw Shield`)
                    .trySkill($skill`Precision Shot`)
                )
                .attack()
                .repeat()
            ),
          limit: { tries: 30 },
        },
        {
          name: "Nightcap (Wine Glass)",
          ready: () => have($item`Drunkula's wineglass`),
          completed: () => !args.ascend || totallyDrunk(),
          do: () => cliExecute(`CONSUME NIGHTCAP VALUE ${get("valueOfAdventure") - 1000}`),
        },
        {
          name: "Nightcap (Marginal)",
          ready: () => have($item`Beach Comb`) || have($item`Map to Safety Shelter Grimace Prime`),
          completed: () => !args.ascend || totallyDrunk(),
          do: () => cliExecute(`CONSUME NIGHTCAP VALUE 500`),
        },
        {
          name: "Grimace Maps",
          completed: () =>
            !args.ascend ||
            myAdventures() === 0 ||
            !have($item`Map to Safety Shelter Grimace Prime`),
          effects: $effects`Transpondent`,
          choices: {
            536: () =>
              availableAmount($item`distention pill`) <
              availableAmount($item`synthetic dog hair pill`) +
                availableAmount($item`Map to Safety Shelter Grimace Prime`)
                ? 1
                : 2,
          },
          do: () => use($item`Map to Safety Shelter Grimace Prime`),
          limit: { tries: 30 },
        },
        {
          name: "Garbo (Drunk)",
          ready: () => have($item`Drunkula's wineglass`),
          prepare: () => uneffect($effect`Beaten Up`),
          completed: () => !args.ascend || myAdventures() === 0,
          do: () => cliExecute("garbo ascend"),
          post: () =>
            $effects`Power Ballad of the Arrowsmith, Stevedave's Shanty of Superiority, The Moxious Madrigal, The Magical Mojomuscular Melody, Aloysius' Antiphon of Aptitude, Ur-Kel's Aria of Annoyance`
              .filter((ef) => have(ef))
              .forEach((ef) => uneffect(ef)),
          clear: "all",
          tracking: "Garbo",
        },
        {
          name: "Comb Beach",
          ready: () => have($item`Beach Comb`),
          completed: () => !args.ascend || myAdventures() === 0,
          do: () => cliExecute(`combo ${11 - get("_freeBeachWalksUsed") + myAdventures()}`),
        },
        {
          name: "Plant Garden",
          ready: () =>
            doneAdventuring() &&
            !!$items`packet of rock seeds, packet of thanksgarden seeds, Peppermint Pip Packet, packet of winter seeds, packet of beer seeds, packet of pumpkin seeds, packet of dragon's teeth`.find(
              (it) => have(it)
            ),
          completed: () => getGarden() !== $item`packet of tall grass seeds`,
          do: () => {
            use(
              $items`packet of rock seeds, packet of thanksgarden seeds, Peppermint Pip Packet, packet of winter seeds, packet of beer seeds, packet of pumpkin seeds, packet of dragon's teeth`.find(
                (it) => have(it)
              ) || $item`none`
            );
            if (args.ascend) cliExecute("garden pick");
          },
        },
        {
          name: "Offhand Remarkable",
          // eslint-disable-next-line libram/verify-constants
          ready: () => have($item`August Scepter`),
          completed: () =>
            !have($skill`Aug. 13th: Left/Off Hander's Day!`) ||
            have($effect`Offhand Remarkable`) ||
            get("_aug13Cast", false),
          do: () =>
            // eslint-disable-next-line libram/verify-constants
            useSkill($skill`Aug. 13th: Left/Off Hander's Day!`),
        },
        {
          name: "Pajamas",
          completed: () => args.ascend || have($item`burning cape`),
          acquire: [
            { item: $item`clockwork maid`, price: 7 * get("valueOfAdventure"), optional: true },
            { item: $item`burning cape` },
          ],
          do: () => {
            if (have($item`clockwork maid`)) {
              use($item`clockwork maid`);
            }
          },
          outfit: () => ({
            familiar:
              $familiars`Trick-or-Treating Tot, Left-Hand Man, Disembodied Hand, Grey Goose`.find(
                (fam) => have(fam)
              ),
            modifier: `adventures${args.pvp ? ", 0.3 fites" : ""}`,
          }),
        },
        {
          name: "Summon Soap Knife",
          completed: () => !have($skill`That's Not a Knife`) || get("_discoKnife"),
          prepare: () => putCloset(itemAmount($item`soap knife`), $item`soap knife`),
          do: () => useSkill($skill`That's Not a Knife`),
          post: () => takeCloset(closetAmount($item`soap knife`), $item`soap knife`),
        },
        {
          name: "Tip the Author", //disabled by default - must manually discover and enable the flag
          ready: () => args.tip,
          completed: () => !have($item`soap knife`),
          do: () => cliExecute(`csend * soap knife to frazazel || Thanks for writing goorbo!`),
        },
        {
          name: "Alert-No Nightcap",
          ready: () => !doneAdventuring(),
          completed: () => stooperDrunk(),
          do: (): void => {
            const targetAdvs = 100 - numericModifier("adventures");
            print("goorbo completed, but did not overdrink.", "red");
            if (targetAdvs < myAdventures() && targetAdvs > 0)
              print(
                `Rerun with fewer than ${targetAdvs} adventures for goorbo to handle your diet`,
                "red"
              );
            else print("Something went wrong.", "red");
          },
        },
      ],
    },
  ];
}
