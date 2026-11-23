/** Editorial revisions reviewed on 2026-11-23. Source links are research references,
 * not replacements for the catalogue's existing download or media URLs.
 * The original description is a concurrency guard: subsequent admin edits win. */
export type CatalogueDescriptionRevision = {
  id: string; title: string; previousDescription: string; description: string;
  previousStatus?: string; status?: string; sources: string[];
};

export const catalogueDescriptionRevisions: CatalogueDescriptionRevision[] = [
  {
    "id": "f005d79c-08aa-48ef-b5ba-6a04f0e2ba50",
    "title": "Pokemon Z English",
    "previousDescription": "A long time ago, the Pokemon world was on the brink of destruction due to a fierce war. King Aster Zephyr built a mysterious machine capable of bringing life back to the fallen. Countless humans and Pokemon perished, yet the war showed no signs of ending.\nDriven by anger and desperation, the king modified his creation and transformed it into a devastating weapon of war. Much of the truth has been lost to history...\nThis is the story of how it all happened... Kalos, 300 years ago.",
    "description": "Pokémon Z travels back to a much earlier Kalos, around 300 years before Pokémon X and Y. EricLostie's standalone fangame uses that setting to tell its own story about a world shaped by war, lost history and the consequences of a powerful machine. New characters and rivals give the journey a different perspective from the modern Kalos adventure.\n\nThe campaign combines a twelve-Gym challenge and Pokémon League with village reconstruction and item crafting, giving you things to build and restore alongside your team. Following Pokémon, animated battle sprites and an original soundtrack bring personality to the historical setting, while the roster draws on later generations. This entry covers the English edition of the fangame. It runs as an RPG Maker-based release rather than a GBA or Nintendo DS ROM, so use the installation instructions supplied with that edition.",
    "sources": [
      "https://whackahack.com/juegos/pokemon-z/"
    ]
  },
  {
    "id": "d9d768fd-c733-418e-94a3-7409e52e267e",
    "title": "Celia's Stupid Romhack: A Pokémon Puzzle Adventure",
    "previousDescription": "A one-of-a-kind puzzle-adventure hack that throws out the usual formula. Set in a reimagined Kanto, it's packed with custom writing, hidden secrets, and creative challenges designed to make you think — not just grind. Best enjoyed with friends watching along.",
    "description": "Celia's Stupid Romhack turns a familiar trip through Kanto into a comedy puzzle adventure. Places, conversations and encounters that might normally be routine become opportunities to question your assumptions about Pokémon. Progress depends on noticing details and trying inventive solutions, with rewritten dialogue and unexpected situations giving familiar locations a new purpose.\n\nCustom art and music support the game's playful tone, while its hint systems provide help when a puzzle stops making sense. Catching and investigating Pokémon also matter beyond building a strong battle team: completing the Pokédex can reveal additional secrets. The full release is playable from beginning to end, making this a complete FireRed-based adventure rather than one of the earlier demos. Its appeal is the pleasure of working things out, especially for players who enjoy exploring unusual ideas or solving puzzles with friends watching along.",
    "sources": [
      "https://www.reddit.com/r/PokemonROMhacks/comments/1ssu910/celias_stupid_romhack_release_trailer/"
    ]
  },
  {
    "id": "3ae0ab45-6c29-4558-abc5-0ce9b8b856d6",
    "title": "Pokémon Light Platinum DS",
    "previousDescription": "A full DS port of the legendary GBA classic Pokémon Light Platinum by WesleyFG. Brings the beloved Zhery and Lauren dual-region adventure to the Nintendo DS with updated visuals and mechanics. Chapter 1 in English officially dropped in April 2025.",
    "description": "Pokémon Light Platinum DS rebuilds WesleyFG's well-known GBA adventure using Pokémon HeartGold as its foundation. Mikelan98's project brings the setting and characters into a Nintendo DS presentation, with redesigned environments and an expanded selection of Pokémon. It is a remake project with its own release schedule, so progress in the original Light Platinum does not describe how much of this version is available.\n\nThe published Chapter 1 release offers the opening part of that larger adventure. Zhery and Lauren belong to the project's broader scope; this listing should not be read as a promise that the entire two-region campaign is finished on DS. Features include Fairy-type support and changes to encounters and shiny availability. Choose this edition for a fresh look at Light Platinum's world, while expecting the limits of a chapter-based demo and checking the patch's required HeartGold revision.",
    "sources": [
      "https://gbatemp.net/threads/release-pokemon-light-platinum-ds-beta-1.402781/",
      "https://www.gamerz.ma/guides/pokemon-light-platinum/"
    ]
  },
  {
    "id": "4e715b9b-3691-4325-ae08-7adf49654e69",
    "title": "Pokémon Emerald Azure",
    "previousDescription": "A heavily content-rich difficulty hack built on the Radical Red dex. Completely new story, new locations, new gyms, and a massive amount of custom content including variant forms, Eeveelutions, and Mega Evolutions. Features every evil team from the Pokémon universe. Currently on v0.5.\n",
    "description": "Pokémon Emerald Azure reshapes Emerald into a story-led challenge with new locations, characters and Gym encounters. Kacey's project pairs that rewritten adventure with Pokémon data based on Radical Red, so familiar species can have different abilities, statistics and moves from their original GBA counterparts. Team selection and an understanding of those changes are central to its difficulty.\n\nCustom variants, additional Eevee evolutions and new Mega Evolutions give the roster its own identity. The adventure also introduces custom moves and activities alongside its revised battles, making it a broader overhaul than a simple increase in trainer levels. The version described here is the 0.5-era work in progress: it has substantial playable content, but the creator still identifies the full project as unfinished. Follow the release notes for emulator recommendations and fixes, and do not assume a guide for vanilla Emerald will describe its progression.",
    "previousStatus": "completed",
    "status": "beta",
    "sources": [
      "https://www.pokecommunity.com/threads/pok%C3%A9mon-emerald-azure.539574/",
      "https://mail.eeveeexpo.com/threads/9270/"
    ]
  },
  {
    "id": "f75175dc-2c01-42f8-9873-7aef0a23a497",
    "title": "Pokémon The Shadow Realm",
    "previousDescription": "An original story-driven hack where wormholes have fractured space and timelines, pulling characters from Kanto, Johto, and Hoenn into a broken world. You wake up with no memory outside Pallet Town and must uncover the mystery behind the corrupted Shadow Realm. Currently a demo.",
    "description": "Pokémon The Shadow Realm opens with an unsettling problem: you have no memory of how you arrived outside Pallet Town, and the world around you is coming apart. Wormholes pull people and places across timelines, bringing pieces of Kanto, Johto and Hoenn into a fractured setting. Investigating that disruption leads toward a mysterious dimension and the return of Shadow Pokémon.\n\nBuilt on Emerald, Jinwoo's hack combines its original story with a modern Pokémon roster, visible overworld encounters and field abilities that reduce dependence on traditional HMs. Those systems make exploration part of the mystery as well as a way to build your party. This is a playable demo, not the complete multi-region adventure: published demo information describes progress through the second Gym and a little beyond. Expect an introduction to its characters and mechanics, with later story developments still outside the available release.",
    "previousStatus": "completed",
    "status": "demo",
    "sources": [
      "https://www.pokeharbor.com/2026/04/pokemon-shadow-realm/"
    ]
  },
  {
    "id": "6ba6f16f-d60c-4778-b83f-ef2d4754a09f",
    "title": "Pokemon Crestfall",
    "previousDescription": "Pokemon Crestfall is a complete Pokemon Emerald ROM hack featuring a brand-new region called Enpale, a unique story, and a 300-Pokemon regional Pokedex featuring Pokemon from every generation. The game adds Mega Evolution, Pokemon-less HM usage, mining, infinite berries, modern quality-of-life improvements, and a custom soundtrack inspired by metal and rock music. It also includes modern Pokemon mechanics and updated Pokemon data, while retaining the classic GBA Pokemon adventure style.",
    "description": "Pokémon Crestfall moves the Emerald adventure to Enpale, a new region with its own routes, settlements and story. Nanday0's hack keeps the recognisable rhythm of exploring, assembling a party and challenging Gyms, while giving that journey a different atmosphere through custom environments and a soundtrack influenced by rock and metal. A regional selection drawn from multiple Pokémon generations encourages experimentation with your team.\n\nMega Evolution and updated battle data bring newer mechanics into the GBA framework. Between major battles, mining and exploration offer reasons to investigate the region, while following Pokémon keep your partners visible outside combat. Convenience features include field-move use without dedicating a party member's moveset to HMs and renewable berry resources. Crestfall is a complete regional adventure, suited to players looking for a fresh setting with familiar Pokémon structure rather than a retelling of Emerald's Hoenn story.",
    "sources": [
      "https://romhackguides.com/hacks/crestfall/"
    ]
  },
  {
    "id": "778baaa1-1545-4c2e-ab54-8101c3f661d2",
    "title": "Pokemon CC: Operation Masquerade",
    "previousDescription": "Pokemon CC: Operation Masquerade is a unique  ROM hack inspired by Arknights' Contingency Contract mode. Instead of a traditional Pokemon adventure, you play as Tiana at an Arknights convention and take on six challenging gauntlets featuring 24 custom trainers. Build and customize your team through a gacha system, choose battle modifiers called Risks to increase the difficulty and rewards, and aim for the highest score possible. Every battle takes place at Level 50, with randomized trainer teams, custom strategies, new moves and abilities, and completely custom graphics.",
    "description": "Pokémon CC: Operation Masquerade puts team-building at the centre of an Arknights-inspired battle challenge. You play as Tiana at a convention, taking on six gauntlets and a cast of custom trainers instead of following a regional Gym journey. Battles use level-50 teams, shifting attention toward matchups, moves and tactical decisions rather than training levels.\n\nIts defining mechanic is the Risk system: optional restrictions and battle modifiers let you raise the stakes in pursuit of better scores and rewards. A gacha-style Pokémon selection system shapes your available options, while trainer pools introduce variety between attempts. Singles and doubles, custom moves and abilities, and a redesigned interface give the challenge its own identity. This complete Emerald-based release works especially well for players who enjoy refining a strategy, comparing attempts and deciding how much extra difficulty their team can handle.",
    "sources": [
      "https://romhackguides.com/hacks/cc-operation-masquerade/",
      "https://github.com/hedara90/contingency-contract/releases"
    ]
  },
  {
    "id": "41e34177-d9cf-4087-acf3-d1c15cafc4f8",
    "title": "Pokemon Wild Indigo",
    "previousDescription": "You are a space trucker whose ship has crashed on a mysterious alien planet, leaving you stranded far from home. With your air supply limited, you'll need to venture across the strange world, study its unusual flora and Pokémon, uncover its hidden secrets, and figure out what brought you here in the first place. Along the way, you'll encounter strange new Pokémon, familiar species with unexpected forms and abilities, environmental puzzles, and dangerous creatures lurking across the planet. What begins as a search for a way home gradually turns into a deeper mystery surrounding the world itself.",
    "description": "Pokémon Wild Indigo begins far from the usual professor's laboratory. You are a space trucker stranded after a crash on an alien planet, trying to survive long enough to understand the world and find a way home. An oxygen supply gives exploration a practical constraint: each trip into unfamiliar terrain asks you to balance curiosity against the resources needed to return safely.\n\nThe planet offers environmental puzzles, visible Pokémon encounters and dangerous wild bosses. Familiar species can have altered types, statistics or abilities, making observation and experimentation more useful than relying entirely on standard Pokémon knowledge. Mega Evolution and updated battle elements sit alongside that survival-focused structure. The linked v1.0.1 release is an Emerald-based adventure with a distinct science-fiction premise, built around discovering how its world fits together rather than simply travelling from one Gym to the next.",
    "sources": [
      "https://romhackguides.com/hacks/wild-indigo/",
      "https://github.com/JosephNied/pokeemerald-expansion/releases/tag/Pokemon-Wild-Indigo-v1.0.1"
    ]
  },
  {
    "id": "7f0f1183-d6a8-414d-ba86-94efc8b75804",
    "title": "Pokémon NEW KANTO II",
    "previousDescription": "Pokémon NEW KANTO II begins with the familiar Kanto adventure but gradually transforms it into a stranger, story-driven journey. Gym requirements and locations may differ, familiar characters take on new roles, and seemingly ordinary routes and buildings conceal new events. As the adventure develops, spatial disturbances and dimensional Rifts connect Kanto to unfamiliar worlds and timelines. MissingNo., Hoopa, RED, Arceus, Giratina, unusual Pokémon encounters, and a more active Sevii Islands storyline become part of a wider mystery. Exploration, optional missions, hidden vaults, rare encounters, and late-game investigations reward players who look beyond the standard FireRed path.",
    "description": "Pokémon NEW KANTO II starts with places you recognise, then gradually changes the rules of the journey. Gym progression, familiar characters and ordinary-looking buildings take on new roles as spatial disturbances and dimensional Rifts spread through Kanto. Its FireRed foundation becomes a setting for a larger mystery involving unusual encounters, displaced people and legendary Pokémon.\n\nExploration extends beyond the main story through mission boards, PKTraders, hidden vaults and terminals. Optional challenges and rare encounters reward revisiting locations rather than assuming that an old Kanto walkthrough has every answer. The Sevii Islands also have a more active place in the adventure. Modern battle additions include Mega Evolution and Dynamax-related encounters, supported by a roster spanning multiple generations. This complete project is best approached with a willingness to explore familiar ground afresh: recognising a location does not guarantee that its events, requirements or rewards remain the same.",
    "sources": [
      "https://gohantips.wixsite.com/pokemon/post/pok%C3%A9mon-new-kanto-ii"
    ]
  },
  {
    "id": "fec0b8a8-6539-42ff-9fe6-6c5445098a34",
    "title": "Pokémon Shining Victory (Revamp) — Demo 1",
    "previousDescription": "A catastrophic clash between two forms of Zygarde sends Ash far from Kalos and leaves him with severe memory loss. Taken in by a family in the unfamiliar Heron Region, he soon becomes entangled in a conflict involving a gang that is stealing Pokémon and disrupting local towns. As Ash explores the region and rebuilds his team, the gang’s orders—and the disaster he can no longer remember—begin to point toward a much larger mystery. Demo 1 combines an original regional journey with expanded Pokémon mechanics, regional forms, Mega Evolution and quality-of-life features.",
    "description": "Pokémon Shining Victory's revamp places Ash in the unfamiliar Heron Region after a clash between Zygarde forms leaves him far from Kalos with severe memory loss. A local family helps him recover, but Pokémon thefts and a disruptive gang soon draw him into another conflict. Rebuilding his team becomes part of discovering what happened to him and why trouble is spreading through the region.\n\nDemo 1 introduces that story through a FireRed-based adventure with regional forms, Mega Evolution, Primal Reversion and visible overworld Pokémon. Updated battle mechanics, reusable TMs and alternatives to trade evolutions make building a party more flexible. The visual presentation adds new tiles and DS-style character sprites. This release covers the opening portion of the revamp, so its new region and larger mystery should be understood as an ongoing project rather than a completed campaign.",
    "sources": [
      "https://www.reddit.com/r/PokemonROMhacks/comments/1wqhsfc/pok%C3%A9mon_shining_victory_revamp_demo_1/"
    ]
  },
  {
    "id": "9800e620-11f7-4ddf-a705-62853cfd9c7c",
    "title": "Pokémon Otherworlds v2.3",
    "previousDescription": "During Hoenn’s Delta Episode, Brendan finds himself facing a crisis that Rayquaza alone cannot resolve. When Devon repairs the Link Cable, a portal pulls him into Hisui, where the boundaries between worlds, memories and familiar faces begin to shift. Pokémon Otherworlds follows Brendan through a compact multiverse adventure filled with changing settings, strange encounters and a journey that connects Hoenn’s meteor crisis to a very different Pokémon world.",
    "description": "Pokémon Otherworlds follows Brendan through an alternate version of Hoenn's Delta Episode, where the approaching meteor cannot be stopped in the expected way. Devon's repaired Link Cable offers a possible answer, but the resulting portal carries him toward Hisui and a journey across unfamiliar realities. Memories, recognisable faces and changing worlds turn a familiar crisis into a new mystery.\n\nThis is a compact, story-focused fangame with an estimated playtime of around four hours. Overworld activities, visible encounters and flashbacks carry much of the experience, while changes to graphics and the protagonist's appearance help distinguish the settings. Distortion World exploration and unusual encounters give it a stranger tone than a conventional Gym quest. The completed v2.3 edition is a standalone Pokémon Essentials/RPG Maker XP game for PC, so it should be installed as a fangame rather than applied to a GBA ROM.",
    "sources": [
      "https://www.astartgaming.com/2024/02/pokemon-otherworlds-rpgxp.html"
    ]
  },
  {
    "id": "7d2f91cb-4aac-48ca-89a2-35016e73346f",
    "title": "Pokémon Vestiges WAH v1.2.0",
    "previousDescription": "Originally released as Pokémon Vestigios de WAH, Pokémon Vestiges WAH is a battle-focused celebration of more than 20 years of the Whack a Hack! community. Choose from pre-built or custom teams, progress through 21 themed challenge rooms, and face 27 administrators and historical figures from WAH’s history across multiple difficulty levels and battle formats. The complete v1.2.0 release now includes an English translation by Raizen, along with a modernized Pokémon Emerald battle engine, Mega Evolutions, community Fakémon and unlockable achievements.",
    "description": "Pokémon Vestiges WAH celebrates the history of Whack a Hack! through a sequence of Pokémon battles. Its challenge tower contains 21 themed rooms, where administrators and notable community figures become opponents. The result is a compact tribute to ROM-hacking culture built around team choices and tactical encounters rather than a conventional regional adventure.\n\nYou can begin with a prepared team or develop a custom lineup using unlockable and purchasable Pokémon. Three difficulty settings and formats including doubles, inverse battles and random teams change how you approach the tower. Mega Evolution, community-created creatures and achievements add further reasons to try different strategies. This listing covers the completed v1.2.0 English release, translated by Raizen from Pokémon Vestigios de WAH. Its Emerald-based battle engine provides the foundation, but the rooms, opponents and community references give the experience its own character.",
    "sources": [
      "https://www.pokecommunity.com/threads/pok%C3%A9mon-vestiges-wah-complete-v1-2-0.543733/"
    ]
  },
  {
    "id": "68e8392b-26db-4663-b63b-863404732d5b",
    "title": "Pokémon Quetzal",
    "previousDescription": "Pokémon Quetzal expands the traditional Pokémon Emerald adventure into a broader, multiplayer-focused journey across Kanto, Johto, and Hoenn. Players can explore together, battle and trade, choose from a wide range of characters and starters, and encounter a roster spanning modern generations. Rather than centering on a documented single-player storyline, Quetzal’s appeal is its freedom: cooperative exploration, playable Pokémon, visible overworld encounters, rideable partners, and a large collection of customization and replayability options create a flexible way to experience the Pokémon world with friends.",
    "description": "Pokémon Quetzal expands Emerald's framework into a flexible adventure built around exploring with your Pokémon and, with a compatible setup, other players. Kanto, Johto and Hoenn provide familiar places to revisit, while character selection, starter choices and a broad modern roster allow very different teams and play styles. Visible encounters and following or rideable Pokémon make those partners a larger part of travelling through the world.\n\nIts attraction is the range of ways to customise a run. Difficulty choices, randomisation and challenge settings sit alongside convenient storage access and changes to field progression. Newer battle systems, including Mega Evolution, add more options beyond Emerald's original mechanics. Multiplayer support depends on the release and emulator configuration, so check the setup instructions for everyone joining. Quetzal continues to evolve across builds; match feature guides and save-compatibility advice to the version you actually download.",
    "sources": [
      "https://pkmnquetzal.top/en/index.html",
      "https://pokemonquetzal.net/features/"
    ]
  },
  {
    "id": "3fea3bf3-f564-454f-806c-4be744bb8a44",
    "title": "Pokémon Homestead v1.0.1",
    "previousDescription": "A short cozy puzzle hack from the perspective of a Pokémon Breeder. Match Pokémon with the trainers they suit best, care for them through interactions, and enjoy a no-battle adventure with a distinctive custom art style.",
    "description": "Pokémon Homestead trades the road to the League for the quieter work of a Pokémon Breeder. Your task is to care for Pokémon and find suitable partners for visiting trainers, turning their different needs into small matching puzzles. Success comes from paying attention to the creatures and people in front of you, with a gentle pace that makes the everyday side of the Pokémon world the main attraction.\n\nThere are no battles. Feeding, playing and other interactions help Pokémon grow, while the custom artwork gives the setting a warm, distinctive personality. Made by FaelingDraws, Mudskip and Montblanc, this Emerald-based project is a short, complete experience rather than a long farming simulation or a traditional badge quest. Version 1.0.1 suits players looking for a relaxed puzzle adventure where understanding a Pokémon's needs matters more than assembling the strongest competitive team.",
    "sources": [
      "https://romhackguides.com/hacks/homestead/",
      "https://www.pokeharbor.com/2026/09/pokemon-homestead/"
    ]
  },
  {
    "id": "95b6dda1-5048-4a4e-aab0-ae5836395777",
    "title": "Pokémon Investigations: Turnabout at Sea v1.0.2",
    "previousDescription": "A short Ace Attorney Investigations crossover set aboard the SS Hana. Play as Miles Edgeworth, investigate a murder across four key incidents, gather evidence with Pokémon, make deductions, and determine the culprit. Approximate playtime: 45 minutes.",
    "description": "Pokémon Investigations: Turnabout at Sea places Miles Edgeworth aboard the SS Hana for a self-contained murder mystery. This Emerald-based crossover brings the investigative style of Ace Attorney together with Pokémon and a Detective Conan-inspired case. Over one eventful voyage, you examine four key incidents, speak with passengers and work out which of two suspects the evidence actually supports.\n\nPokémon participate in the investigation rather than merely decorating the setting. Their assistance, trainer encounters and discovered facts help you build a picture of what happened. The game offers 31 facts to connect into deductions, then asks you to construct an argument by identifying a suspect and presenting evidence. Five possible endings reflect how convincingly you assemble the case. The completed v1.0.2 release is designed as a short mystery of roughly 45 minutes, with the focus on observation and reasoning rather than a full regional Pokémon journey.",
    "sources": [
      "https://www.reddit.com/r/PokemonRomhackDev/comments/1wcetm9/tarc3_pok%C3%A9mon_investigations_turnabout_at_sea_an/"
    ]
  },
  {
    "id": "aff98dbe-e998-4854-9c2e-b669f515f431",
    "title": "Pokémon Team Rocket Edition: Dragonsden 2026 (Spanish)",
    "previousDescription": "Play from Team Rocket’s perspective across Kanto, Archi7, Johto, and Hoenn. The October 1, 2026 release adds Easy, Normal, and Hard modes, a day/night system, Pokémon through Generation 9, Legends: Z-A Mega Evolutions, and approximately 115 hours of content. This release is in Spanish; an English release is planned/upcoming.",
    "description": "Dragonsden's Pokémon Team Rocket Edition approaches the Pokémon world from inside its best-known criminal organisation. The Spanish 2026 edition spans Kanto, Archi7, Johto and Hoenn, giving Team Rocket's ambitions a much larger stage than a single-region adventure. Familiar places gain a different meaning when your role is to carry out the organisation's work rather than stop it.\n\nThe release combines a long story campaign with Easy, Normal and Hard settings, a day-and-night system and a roster drawing on Pokémon through Generation 9. Expanded Mega Evolution options add another layer to building your team. This is Dragonsden's Emerald-based project, distinct from ColonelSalt's FireRed: Rocket Edition. The linked edition is in Spanish; English translations and older releases may cover different content. Check the language and version before choosing a walkthrough, since the scope of this edition should not be assumed for every similarly named download.",
    "sources": [
      "https://romhackguides.com/hacks/team-rocket-edition-dragonsden/",
      "https://teamrocketedition.com/"
    ]
  },
  {
    "id": "6a62fbe1-6d15-45c0-9551-befe1912a9a3",
    "title": "Pokemon Tag Team Trials",
    "previousDescription": "Team Aqua and Team Magma have put their rivalry aside, at least for now. Two grunts from the opposing teams find themselves forced to work together, relying on each other's abilities to overcome a series of obstacles and challenges. Switch between the Aqua and Magma members, use their combined tools to solve puzzles, and work together as you make your way through the adventure. What begins as an unlikely partnership puts both trainers in situations where neither can succeed alone.",
    "description": "Pokémon Tag Team Trials asks an Aqua grunt and a Magma grunt to put their rivalry aside and solve problems together. Each character brings different abilities to the partnership, and obstacles are designed around combining those tools. In single-player, switching between the two lets you plan both halves of a solution, giving the adventure the feel of a cooperative puzzle even when you play alone.\n\nThe Emerald-based game favours compact challenges and coordination over a conventional journey through Gyms. Battles and environmental puzzles grow out of the unlikely alliance, making the characters' dependence on one another the central idea. Later 2.0-series releases add two-player cooperation through a compatible multiplayer emulator setup. The existing download here is not version-labelled, so confirm its release notes before expecting that feature. The core appeal remains the same: understanding what each partner can do and finding a way forward together.",
    "sources": [
      "https://romhackhub.com/hacks/pokemon-tag-team-trials/"
    ]
  },
  {
    "id": "67e6e781-b815-4e1a-b157-c26f2a808c28",
    "title": "Pokémon SoulGold",
    "previousDescription": "SoulGold reimagines Johto as a large Emerald-based adventure with new routes, new areas and a substantial post-game. Rather than simply retelling the original journey, it expands the region with additional battles, legendary encounters and modern mechanics, while adding quality-of-life tools that make a long adventure easier to manage.",
    "description": "Pokémon SoulGold builds an expanded Johto adventure on Emerald, adding routes, environments and battles around the familiar regional journey. Its focus is on giving Johto more room to explore, with additional caves, legendary encounters and post-game challenges extending the experience beyond the main campaign. New Pokémon options and a broad Mega Evolution selection change how you can assemble a team along the way.\n\nConvenience systems help make that larger journey manageable. The Candy Jar supports levelling, EXP All can be toggled, and move relearning is available from the party interface. Field progression avoids the need to keep HM moves in your battle movesets, while Pokémon-specific Surf sprites add personality to travel. SoulGold draws on an unofficial Heart & Soul expansion port and is a separate project from the official Heart & Soul releases. Use SoulGold-specific documentation and release notes when checking progression or updating a save.",
    "sources": [
      "https://soulgold.run/about"
    ]
  },
  {
    "id": "525d6453-78e1-4027-a6f5-f0d7c7d0c658",
    "title": "Pokémon: Team Rocket Edition — Final public patch",
    "previousDescription": "Rocket Edition retells the familiar FireRed era from the other side of the law. Instead of playing as a conventional Pokémon hero, you join Team Rocket, steal Pokémon from defeated trainers and uncover the corruption, rivalries and hidden schemes behind familiar events. The story reframes well-known characters and places through the eyes of a criminal recruit trying to rise through the organization.",
    "description": "Pokémon FireRed: Rocket Edition retells Kanto's familiar adventure from the other side of the law. As a new Team Rocket recruit, you work your way through the organisation while Red's journey unfolds around you. ColonelSalt's story uses that parallel perspective to explore conspiracies, compromised authority figures and the lives of people the original hero passes by.\n\nStealing Pokémon from defeated trainers is central to both progression and team-building. Rising through Rocket's ranks expands the kinds of trainers you can steal from, making your position in the organisation mechanically meaningful. New missions, conversations and scripted events reshape well-known places without requiring an entirely unfamiliar map. The final public patch offers a complete story with a darker tone than the official games. This is the FireRed-based Rocket Edition; it is a separate adventure from Dragonsden's Emerald-based Team Rocket project and uses different saves, patches and walkthroughs.",
    "sources": [
      "https://rocket-edition.com/"
    ]
  },
  {
    "id": "475e2133-999f-4439-be4e-f6ce1907b044",
    "title": "Pokémon World Stadium",
    "previousDescription": "World Stadium is designed as a post-game tournament experience rather than a conventional route-by-route adventure. Professor Oak opens access to a battle-focused hub where players can face famous Gym Leaders, Champions, rivals and villains with optimized teams. There is very little traditional grinding or exploration: the focus is on high-level battles, team-building and a series of competitive challenges.",
    "description": "Pokémon World Stadium concentrates the appeal of a Pokémon post-game into a battle-focused hub. After Professor Oak introduces the challenge, you face recognisable Gym Leaders, rivals, Champions and villains with teams built to test your decisions. The emphasis is on preparing a capable lineup and tackling strong opponents, with much less of the route exploration that normally separates major battles.\n\nAccess to items and move tutors supports experimentation, making it easier to adjust a strategy between challenges. Battle Tower content and unusual Pokémon options broaden the selection of matchups beyond a straightforward League rematch. Sacred GBC's project is built on FireRed, despite its post-game and DLC-style presentation; it is not an expansion that automatically attaches to every other Pokémon hack. The current listing links an unlocked v3.98 patch, so use documentation for that build when checking available opponents, forms and progression requirements.",
    "sources": [
      "https://www.pokeharbor.com/2023/04/pokemon-world-stadium/"
    ]
  },
  {
    "id": "4c48d1d2-2ea6-4661-8802-9b41c5bfbca7",
    "title": "Pokémon Ghost Grey — v1.0.4",
    "previousDescription": "Fifty years after the familiar Kanto era, the region has become a decayed, unsettling place where Ghost Pokémon dominate and the old world has changed beyond recognition. Ghost Grey turns the familiar journey into a horror-tinged mystery, filling Kanto with eerie locations, original regional variants and a new soundtrack while giving the player a very different reason to explore.",
    "description": "Pokémon Ghost Grey returns to Kanto fifty years later, after the familiar region has become a decaying and unsettling place. Ghost Pokémon and original regional variants fill the journey, while altered locations, custom artwork and a new soundtrack turn once-recognisable surroundings into a horror mystery. Joey Zeed's hack draws on the atmosphere of Pokémon creepypastas rather than the cheerful tone of a standard League challenge.\n\nThe battle system combines newer mechanics, including the Fairy type and physical/special split, with unusual moves and a heavily themed roster. Its approach to raising a team is also different: breeding, EVs and IVs are absent, while levelling tools and early convenience items reduce preparation time. This listing describes v1.0.4, so later fixes should be checked against the release notes. Expect a complete FireRed-based adventure whose main distinction is its eerie setting and redesigned Pokémon ecosystem.",
    "sources": [
      "https://www.polisheddex.app/ghostgrey/guides/getting-started",
      "https://www.pokeharbor.com/2026/10/pokemon-ghost-grey/"
    ]
  },
  {
    "id": "77be5258-ccd9-4a98-8583-0f11ad4b4434",
    "title": "Pokémon Amethyst — v1.4.0",
    "previousDescription": "Amethyst sends the player to the Kulure region for a fresh adventure built around modern Pokémon battles and an increasingly challenging journey. Alongside a new regional Pokédex and story, the game lets players tune the difficulty and unlock modifiers through progress. Its latest update adds a Battle Frontier with multiple facilities and dynamically assembled opponents, giving experienced players a large post-game challenge.",
    "description": "Pokémon Amethyst follows a new trainer through Kulure, an original region built around a full story and increasingly demanding battles. Created by duck_caper, it brings a broad selection of Pokémon into a FireRed-based adventure with Mega Evolution, the Fairy type and updated battle mechanics. The regional journey has its own characters and challenges rather than simply raising the difficulty of Kanto.\n\nCasual and Hard settings offer different ways to approach the campaign, while progression-based modifiers provide further control over the experience. Wild battles award PokeChips, giving everyday encounters a purpose beyond experience and catches. Daily activities and post-game challenges extend the adventure, with the v1.4.0 update adding a Battle Frontier with eight facilities. This entry covers that version of the complete game; encounter tables, modifiers and Frontier behaviour can change between patches, so consult matching documentation when planning a team.",
    "sources": [
      "https://romhackguides.com/hacks/amethyst/",
      "https://www.pokemoncoders.com/pokemon-amethyst-cheats/"
    ]
  },
  {
    "id": "a7a77dd5-6089-4b33-8448-e4013d815b15",
    "title": "Pokémon Lazarus — v2.0",
    "previousDescription": "Lazarus takes the player to the Ilios region, where a new adventure combines the familiar Pokémon journey with a sharply tuned difficulty curve. Gym leaders and major opponents use carefully rebuilt teams, and the expanded Pokédex gives the region a much more modern feel. Choose Normal or Hard mode to set the challenge level before setting out.",
    "description": "Pokémon Lazarus introduces Ilios, a new region whose Greek-inspired scenery gives the familiar Pokémon journey a different sense of place. Nemo622's Emerald-based adventure combines an original story with a curated roster spanning multiple generations, allowing both returning favourites and newer species to shape your team. Exploration and regional discovery remain central, alongside battles designed to reward thoughtful preparation.\n\nNormal and Hard modes let you choose how demanding the campaign should be. Gym-based level caps and reworked opponent teams keep major encounters from being solved solely by outlevelling them, while modern conveniences reduce repetitive preparation. The v2.0 release revisits the balance and experience in response to player feedback. This is a complete regional adventure, with its own maps and progression rather than an Emerald reskin. Use the documentation included with the patch for version-specific encounters and difficulty details.",
    "sources": [
      "https://ko-fi.com/s/4baddcdbdc",
      "https://gbatemp.net/news/pokemon-lazarus-gets-significant-v2-0-update-based-on-player-feedback-alongside-alola-seaglass-announcement.679689/"
    ]
  },
  {
    "id": "2fe551e0-0d14-4cf7-bc3b-035300c38fd8",
    "title": "Pokémon Too Many Types 2 — v1.5.2",
    "previousDescription": "Two years after the events of the original, Too Many Types 2 returns to Hoenn with an even more chaotic take on Pokémon battles. The project expands the type system far beyond the usual eighteen types, gives some Pokémon three types and introduces a large set of custom moves. The result is a funny, surprising sequel that rewards players who learn its unusual matchups and team-building rules.",
    "description": "Pokémon Too Many Types 2 returns to Hoenn two years after the original with a much larger collection of unlikely type matchups. Its expanded system contains 80 types, and some Pokémon carry three at once. Familiar instincts can suddenly become unreliable, turning team-building into a process of discovering new strengths, weaknesses and combinations.\n\nThe sequel supports that premise with an original story, revised areas and a large collection of custom moves. Opponents use the expanded type pool too, so the unusual rules matter throughout the adventure rather than appearing only as a visual joke. New events and challenges give returning players reasons to investigate Hoenn again. The completed v1.5.2 release is best suited to players who enjoy experimentation and the humour of an intentionally excessive ruleset. Keep its own type information handy: a standard Pokémon chart will not explain how this game's battles work.",
    "sources": [
      "https://www.pokecommunity.com/threads/pok%C3%A9mon-too-many-types-2.539542/page-6",
      "https://pokehostel.com/pokemon-too-many-types-2/"
    ]
  },
  {
    "id": "f96380a0-ad5f-4784-8af5-9798b45da1e8",
    "title": "Pokémon Super Mariomon — v1.5.2 Anniversary",
    "previousDescription": "This crossover swaps the usual Pokémon journey for a trip through the Mushroom Kingdom. Instead of collecting Gym Badges and building a traditional Pokémon team, players gather Power Stars, capture Mario-inspired creatures, explore themed worlds and challenge an assortment of familiar characters. It keeps the structure of a Pokémon RPG while making the world, cast and encounters unmistakably Mario.",
    "description": "Super Mariomon transforms Emerald into a journey through the Mushroom Kingdom. Mario-inspired creatures become your collectible battle partners, and Power Stars take the place of the familiar Gym Badge chase. Themed worlds and recognisable characters give the adventure a playful crossover identity while preserving the pleasure of assembling a team and finding ways through tough encounters.\n\nLuigi and other familiar faces appear in competitive roles, with a full campaign and post-game battles providing more than a short novelty tour. Optional level caps, level scaling, EV controls and plentiful levelling resources let you adjust the amount of preparation and challenge. A built-in Nuzlocke mode supports a more restrictive run, while rematches and additional battle content give established teams further tests. This listing covers the v1.5.2 Anniversary edition; use its matching release notes and patches when checking compatibility with earlier Mariomon saves or translations.",
    "sources": [
      "https://poketeca.com.br/en/hack/super-mariomon/"
    ]
  },
  {
    "id": "a024ffe4-ca38-4ade-b56b-34dc1b3d42e9",
    "title": "Pokémon Spirits of the Storm — v1.2.01",
    "previousDescription": "Spirits of the Storm is a compact mystery adventure in which Looker teams up with Anabel to investigate strange events around the port city of Porta Bella and the nearby woods. Instead of relying on wild encounters and conventional TM collecting, the game gives you a story-driven roster and focuses on tactical double battles, investigative side quests and unusual battle information that helps you plan your turns.",
    "description": "Pokémon Spirits of the Storm brings Looker and Anabel to the port city of Porta Bella, where a routine investigation opens into something stranger. Streets, nearby woodland and the people living there form the setting for a compact detective adventure. Main and side quests encourage you to follow leads, solve local problems and uncover more than the central mystery.\n\nEvery battle uses doubles, with a story-driven roster replacing the usual emphasis on catching and grinding along routes. A turn-preview feature lets you inspect planned actions, targets and order, making careful coordination a defining part of combat. Party recovery between fights and adjusted PP support that puzzle-like approach to battles. Normal and Hard modes offer different opponent builds. The completed v1.2.01 release is an Emerald-based mini-adventure for players who want investigation and tactical decisions in a concentrated format rather than a long Gym circuit.",
    "sources": [
      "https://romhackguides.com/hacks/spirits-of-the-storm/",
      "https://romhackhub.com/hacks/pokemon-spirits-of-the-storm/"
    ]
  },
  {
    "id": "174f5ef5-b3d0-4717-ab40-39c09643e2e0",
    "title": "Pokémon Golden Glazed — v2.6",
    "previousDescription": "Golden Glazed revisits the Glazed-style adventure with an updated Pokémon roster and revised battles, while adding new surprises to its regions and story. The hack modernizes the experience with Pokémon from later generations and a wider Mega Evolution roster, making it a substantial alternative for players who have already explored the original Glazed adventure.",
    "description": "Pokémon Golden Glazed revisits the world and adventure of Glazed with a revised roster and a different approach to battles. Golden's version adds Pokémon from later generations, including Alolan forms, giving returning players new choices for a journey they may already recognise. Updated trainer encounters and additional events change how familiar stretches of the adventure unfold.\n\nOne of its distinctive features is permanent Mega Evolution, alongside custom Mega forms. That differs from the temporary battle transformation used by many other hacks, so team planning should follow Golden Glazed's own rules. Its Emerald and Glazed foundations make it a substantial regional adventure rather than a standalone battle challenge. This listing covers the completed v2.6 edition. Treat it as its own branch of Glazed: original Glazed guides can provide context, but species availability, balance, events and save compatibility should be checked against this version.",
    "sources": [
      "https://www.pokeharbor.com/2024/11/pokemon-golden-glazed/"
    ]
  },
  {
    "id": "402ba6fc-17f4-4541-a632-659342839749",
    "title": "Pokémon Emerald Seaglass — v3.0",
    "previousDescription": "Emerald Seaglass reimagines Hoenn through a soft, nostalgic visual style inspired by classic Game Boy Color-era Pokémon games. Beneath the pastel palette and retro presentation, the adventure adds a broad set of modern conveniences and battle updates, giving the familiar Emerald journey a fresh look without abandoning its core structure.",
    "description": "Pokémon Emerald Seaglass gives Hoenn a softer, nostalgic identity through artwork inspired by the Game Boy Color era. Towns, routes, characters and battles share that visual treatment, making the familiar Emerald journey feel newly illustrated rather than simply recoloured. Nemo622's project keeps the regional adventure recognisable while adding reasons to pay attention to its scenery and encounters again.\n\nUnderneath the retro presentation are modern battle updates and practical conveniences. Expanded Pokémon availability broadens team choices, while additional activities and minigames provide breaks from the main quest. The result suits players who enjoy classic Pokémon pacing but appreciate a more comfortable way to revisit it. Version 3.0 is a complete release with its own patch and documentation. Use those documents for changed encounters and mechanics; the nostalgic appearance does not mean that every system follows the original Game Boy Color games.",
    "sources": [
      "https://ko-fi.com/nemo622",
      "https://cdromance.com/hacks/pokemon-emerald-seaglass",
      "https://romhackguides.com/hacks/emerald-seaglass/"
    ]
  },
  {
    "id": "658a2907-9f83-4bbf-a858-5b31fffb445b",
    "title": "Pokémon Let’s Go Lugia — v6.3",
    "previousDescription": "Let’s Go Lugia reworks the FireRed framework around Johto and its Pokémon, with a choice of protagonists and changes to the way the adventure unfolds. The game emphasizes Johto species, fresh maps, character-specific Pokémon and convenience features, giving the player a different route through a familiar GBA structure.",
    "description": "Pokémon Let's Go Lugia uses FireRed's GBA framework for a Johto-focused adventure inspired by SoulSilver. Its roster puts Johto Pokémon and their evolutions in the spotlight, with selected Kanto species filling out encounters and important opponents' teams. Choosing between Ash and May also changes the character flavour of the journey and some of the Pokémon associated with it.\n\nNew maps and story adjustments give the game its own route through familiar ideas. Visible Pokémon, updated moves, EXP All and reusable TMs make exploration and team preparation more convenient. Egg-related activities, Elite Four challenges and Battle Tower content add further things to pursue. The v6.3 release is presented as a complete game, with different language editions available. Despite the Let's Go name, this is a fan-made FireRed hack with its own mechanics, so it should not be assumed to reproduce the Nintendo Switch games exactly.",
    "sources": [
      "https://www.pokeharbor.com/2023/01/pokemon-lets-go-lugia/"
    ]
  },
  {
    "id": "1743e0a4-d63c-4ff9-af12-b588990c871d",
    "title": "Pokémon Orange Islands — Beta 5.7",
    "previousDescription": "Orange Islands follows the Orange Archipelago adventure inspired by the Pokémon anime. Instead of the usual eight-Gym journey, the player explores island challenges and faces the Orange Crew, with Ash and Pikachu-style story beats, new maps and distinctive island obstacles. Its gameplay also adjusts how field moves and catches work to better suit the island setting.",
    "description": "Pokémon Orange Islands adapts the anime's Orange Archipelago adventure into a FireRed-based game. Ash and Pikachu's island journey provides the framework, with new maps, familiar companions and challenges built around the Orange Crew. Four League badges replace the usual eight-Gym circuit, giving the campaign a different scale and rhythm from a standard Kanto adventure.\n\nIsland obstacles and item-based field actions support exploration, while the physical/special move split updates combat. The Pokémon selection stays close to the anime-era setting, including Kanto species and Tracey's Marill, rather than trying to include every generation. Kalarie's Beta 5.7 retains a beta label in its name, but its documented story content is complete, including the Movie 2000 event on Shamouti Island. It is a good fit for players who want to explore this particular anime chapter in a traditional GBA RPG format.",
    "sources": [
      "https://www.gamebrew.org/wiki/Pokemon_Orange_Islands_GBA"
    ]
  },
  {
    "id": "20deb5df-f972-4523-8a6b-e236f6a08c97",
    "title": "Pokémon Clover — v1.3.3",
    "previousDescription": "Clover is a huge, irreverent adventure in the Fochun region, built around an original Pokédex of Fakemon, a large cast and deliberately offbeat humor. Beneath its controversial jokes and unusual designs is a demanding, carefully balanced RPG with a full story, numerous side areas and post-game challenges.",
    "description": "Pokémon Clover builds an extensive FireRed-based adventure around 386 original Fakemon and the regions of Fochun and the Ebin Isles. Its unfamiliar creatures, custom music and rewritten world make learning the game part of the experience: familiar Pokémon names and teams will not carry you through every encounter. Challenging trainers and Gym Leaders reward a willingness to study abilities, matchups and team roles.\n\nSide quests, hidden areas and substantial post-game content give the adventure room to develop beyond its parody premise. Modern conveniences such as reusable TMs make experimentation easier, while the battle design remains aimed at experienced players. Clover's humour comes from imageboard culture and includes deliberately offensive language and adult themes, so its tone will not suit everyone. This entry covers the completed v1.3.3 edition; follow the project's patch instructions and use version-matched documentation for its custom roster.",
    "sources": [
      "https://poclo.net/"
    ]
  },
  {
    "id": "a7b56c17-01ff-42df-a629-a551d76e70e9",
    "title": "Pokémon Elysium — v2.5.0",
    "previousDescription": "Elysium follows a young trainer from Crysta into a championship journey that grows into a two-part story involving ancient forces and the mysterious Therian Isles. Its world and battle mechanics are substantially reworked, with modern type systems and Mega Evolution, while the final chapter takes the story beyond the main region.",
    "description": "Pokémon Elysium begins with a young trainer from Crysta pursuing a place in a championship, then grows into a larger story across Rhea, Savahnn and the mysterious Therian Isles. Its FireRed foundation supports an original setting, cast and sequence of events, with exploration and ancient forces drawing the journey beyond a straightforward badge quest.\n\nMega Evolution, the Fairy type and a physical/special split update the battle system. Custom creatures and moves give the world additional surprises, while reusable TMs, revised trade evolutions and item-based field actions reduce familiar restrictions on team-building. Version 2.5.0 is distributed in two parts: the main adventure and the Elysium finale. Follow the project's instructions for moving between them and retaining your progress. The complete story spans those parts, so the finale should not be mistaken for content automatically included in every single patch file.",
    "sources": [
      "https://www.pokecommunity.com/threads/pok%C3%A9mon-elysium-gba.502953/",
      "https://romhackguides.com/hacks/elysium/"
    ]
  },
  {
    "id": "ccbfa029-ad04-44f3-a499-87a236270c3a",
    "title": "Pokémon Odyssey — v4.1.1 Expanded Bag",
    "previousDescription": "Inspired by Etrian Odyssey, Pokémon Odyssey trades the familiar Gym circuit for a story about joining the Adventurers Guild in Talrega and exploring the mysterious Yggdrasil labyrinth. The journey is focused on dungeon exploration, party management and story progression, creating a different kind of Pokémon RPG built around discovery rather than a standard badge quest.",
    "description": "Pokémon Odyssey takes the adventure beneath Talrega, where the Yggdrasil Labyrinth draws explorers into a dangerous world of layered mysteries. Inspired by Etrian Odyssey, it replaces the standard Gym circuit with an Adventurers Guild and a story centred on investigating the depths. Each new part of the labyrinth brings different environments, encounters and reasons to reconsider your party.\n\nDouble battles make cooperation between team members especially important. Dungeon progression and party management take the place of a familiar route-to-Gym routine, while original characters and events give the expedition a clear narrative purpose. The FireRed-based game also introduces its own battle ideas, including an Aether type. This listing covers the completed v4.1.1 release with the expanded Bag update. It is suited to players who enjoy dungeon exploration and coordinated battle strategies, with version-specific documentation helping explain systems that differ from ordinary FireRed.",
    "sources": [
      "https://romhackguides.com/hacks/odyssey/"
    ]
  },
  {
    "id": "367f09b3-a1a2-4f20-8c1a-1deb8b081347",
    "title": "Pokémon Sword & Shield Ultimate Plus — v1.2.1.2",
    "previousDescription": "This FireRed-based project reworks the Galar adventure into a GBA-style game, including the central Sword and Shield story and substantial post-game journeys through the Isle of Armor and Crown Tundra. It combines modern Pokémon systems and a large selection of later-generation species with features such as Dynamax, Gigantamax and additional battle gimmicks.",
    "description": "Pokémon Sword & Shield Ultimate Plus reinterprets the Galar adventure through a FireRed-based GBA game. It adapts the central Sword and Shield journey and extends the campaign with Isle of Armor and Crown Tundra content, giving a familiar modern setting the look and structure of a handheld ROM hack. The roster draws heavily on Generations 1–8, with selected later additions.\n\nDynamax and Gigantamax sit alongside other battle options, including Mega Evolution and Z-Moves. DexNav access, autosprint, side quests and legendary hunts add practical tools and additional goals beyond the main story. The completed English v1.2.1.2 release has multiple patch variants, including options intended for different performance or challenge preferences. Read the included instructions to choose the correct patch and base ROM revision. This is a fan adaptation with its own implementation, rather than a direct port of the Switch games.",
    "sources": [
      "https://github.com/Ddaretrogamer/Sword-and-Shield-Ultimate-Plus/blob/main/README.md",
      "https://www.pokecommunity.com/threads/sword-and-shield-ultimate-plus-gba-english-version-complete-1-2-1-2.526384/"
    ]
  },
  {
    "id": "0fff7aeb-aa45-4ada-8573-245a71f091ae",
    "title": "Pokémon Valiant — v4.3.0 (Beta)",
    "previousDescription": "Valiant is a story-led Emerald hack set in a new region where the Gym challenge gradually opens into a deeper mystery surrounding the world and its history. As the adventure progresses, the plot introduces time-travel elements and larger stakes, with optional discoveries and story threads beyond the standard badge journey. The current public release is a beta and remains under development.",
    "description": "Pokémon Valiant starts with the appeal of a fresh regional journey, then uses its Gym challenge to lead into a mystery about the world's history. Custom maps, characters and story events give Shahar's Emerald-based project an identity beyond its original engine. As the plot develops, Celebi and time-travel elements connect present-day problems with events from the past.\n\nNew trainer encounters and major battles provide the structure for building a party, while exploration and optional discoveries add context to the unfolding story. Its emphasis is on following the region's mysteries and characters rather than replaying Hoenn with a few changed encounters. Version 4.3.0 is a beta: it contains playable story progress, but later content remains part of the project's development. Choose it with that scope in mind, and consult the matching release notes before assuming a walkthrough covers the whole planned adventure.",
    "sources": [
      "https://romhackguides.com/hacks/valiant/"
    ]
  },
  {
    "id": "845b70b6-6624-45bb-95b7-7763997fc964",
    "title": "Pokémon Heart & Soul — v2.0.6",
    "previousDescription": "Heart & Soul brings Johto’s adventure and a Kanto post-game into an Emerald-based game rebuilt with modern Pokémon systems. It combines the familiar region and characters with contemporary battle mechanics, following Pokémon and new ways to revisit important battles, while offering enough options to tailor the adventure to different play styles.",
    "description": "Pokémon Heart & Soul brings Johto's familiar story to an Emerald-based GBA adventure, with Kanto opening after the League. It draws on the region's classic identity while rebuilding its presentation and systems around a more modern engine. Following Pokémon, time-dependent encounters and the Pokégear help retain the everyday details that make travelling through Johto distinctive.\n\nCustomisation and difficulty settings let you shape the journey, with randomiser and Nuzlocke options offering additional approaches to repeat playthroughs. Trainer and Gym rematches, Safari Zones, Battle Tents and Battle Frontier activities provide goals beyond the main story. Updated abilities, items and battle mechanics broaden the possibilities for a team without requiring an unfamiliar regional setting. This listing covers the completed v2.0.6 release. The 2.x rebuild has its own documentation and patch instructions, so follow those when checking mechanics or upgrading from older versions.",
    "sources": [
      "https://pokemonhns-development.github.io/pokehns-expansion-documentation/",
      "https://github.com/PokemonHnS-Development/pokehns-expansion/releases"
    ]
  },
  {
    "id": "eaf677a8-ee38-48f7-828c-35663ae5ad63",
    "title": "Pokémon Kosmo — Final",
    "previousDescription": "Kosmo is a Fakemon-focused FireRed adventure from WeslyFG, the creator associated with Pokémon Light Platinum. It introduces a large set of original creatures and takes the player through a new region with a distinctly different Pokédex.",
    "description": "Pokémon Kosmo gives FireRed a new identity through a regional roster of around 150 Fakemon. Familiar expectations about which Pokémon you will find are replaced by the chance to discover different designs and evolutions as you travel. New locations, tiles and sprites make that change visible throughout the adventure, while character portraits add personality to important conversations.\n\nCredited to WeslyFG, the creator associated with Light Platinum, Kosmo focuses on the appeal of exploring with an unfamiliar collection of creatures. It is presented as a final release, but that label should not be taken as a guarantee of ongoing support or a bug-free experience. Contemporary release coverage reports that its original post was withdrawn and raises concerns about permission for some contributed artwork. Those questions remain separate from the game's playable content; this listing does not verify redistribution rights for the linked files.",
    "sources": [
      "https://www.pokeharbor.com/2024/05/pokemon-kosmo/",
      "https://pokebat.net/2024/05/pokemon-kosmo.html"
    ]
  },
  {
    "id": "42133acf-62fd-436b-9205-c384a9ed4a6c",
    "title": "Pokémon Victory Fire — v2.75",
    "previousDescription": "Victory Fire begins the story in the Tyron region and follows a new trainer caught up in a conflict involving Team Mirage. Its custom region, large cast and story-driven battles make it a substantial Emerald-based adventure and the first entry in a wider storyline connected to later games such as Resolute and Mega Power.",
    "description": "Pokémon Victory Fire begins in Tyron, where a young trainer's ambitions become entangled with a mysterious dream and the activities of Team Mirage. An attack on Professor Ivan draws the player into a conflict that reaches beyond the usual quest to become Champion. New towns, routes and characters give this Emerald-based adventure its own regional identity.\n\nCreator 1158 uses scripted events, rival encounters and major trainer battles to carry the story, with an expanded selection of Pokémon supporting the journey. Victory Fire also establishes part of the wider story world revisited in projects such as Resolute and Mega Power. Version 2.75 is a complete release, but it retains the feel of an older ROM hack rather than a modern convenience overhaul. Its main attraction is a substantial original campaign and the chance to explore the beginning of that connected series.",
    "sources": [
      "https://www.pokecommunity.com/threads/pokemon-victory-fire-version-2-75-released.285031/"
    ]
  },
  {
    "id": "54f44108-380f-4951-9cb9-c79b0dda66d0",
    "title": "Pokémon Emerald Enhanced",
    "previousDescription": "Emerald Enhanced transforms Hoenn into a much more flexible adventure, with an emphasis on player choice, open exploration and systems that differ from the original Emerald journey.",
    "description": "Pokémon Emerald Enhanced rebuilds Hoenn around freedom of choice. Instead of following Emerald's fixed Gym order, you can explore more openly while encounters and trainers scale with your progress. Branching quests and faction choices, including work associated with Devon, Team Magma and Team Aqua, give your decisions a greater role in shaping the adventure.\n\nIts broader RPG systems include activities such as mining, botany and alchemy, alongside achievements and tools for developing a team. Different play modes offer ways to change the challenge or begin another run with a different focus. This is a substantial overhaul of Emerald's structure, so vanilla walkthroughs will not describe many of its systems. The linked GitHub repository is a source-code project, not necessarily a ready-to-play release download. Consult the developers' release guidance for the appropriate build, supported emulator and save-compatibility instructions.",
    "sources": [
      "https://www.pokemoncoders.com/pokemon-emerald-enhanced/",
      "https://github.com/Enhanced-Projects/Emerald-Enhanced"
    ]
  },
  {
    "id": "64dde6fd-a23e-4e00-8209-fd8d394871c5",
    "title": "Pokémon Dreamstone Mysteries",
    "previousDescription": "Dreamstone Mysteries is an Emerald-expansion project set in the new region of Cormoria, a place of frozen mountains, fiery craters, misty swamps, cities and shadowy underground areas. It aims to give the classic Pokémon adventure a fresh region and mystery-driven journey while expanding the game engine with modern mechanics.",
    "description": "Pokémon Dreamstone Mysteries takes you across Cormoria in search of the missing Professor Tenebris and the truth behind the Dreamstones. Frozen mountains, volcanic terrain, misty swamps and city streets give the new region a varied backdrop, while Team Somber's interest in the stones turns the investigation into a wider threat. The story combines a familiar Pokémon adventure with more personal side quests and mysteries.\n\nA curated roster keeps team-building focused, supported by Mega Evolution and modern battle conveniences. Early access to tools such as mints, bottle caps and an EV editor reduces repetitive preparation, while a quest tracker helps organise the journey. Following Pokémon, field abilities without traditional HM requirements and distinctive overworld encounters add to exploration. Built on Emerald's expanded engine, the project is distributed through its release repository; follow the notes for the particular build when installing or updating.",
    "sources": [
      "https://github.com/dsmyst/dreamstone-mysteries"
    ]
  },
  {
    "id": "a2438632-c81e-4720-a802-69f3fc74644a",
    "title": "Pokémon Aesthetic Red — v1.2",
    "previousDescription": "Aesthetic Red opens up Kanto and the Sevii Islands so players can approach much of the adventure in their own order. Its focus is on a cleaner presentation and a more flexible journey, with day/night changes, redesigned trainers and Gyms, a modernized move/item selection and a broad set of quality-of-life upgrades.",
    "description": "Pokémon Aesthetic Red gives Kanto a carefully reworked visual and musical identity. New environments, menus, fonts and sprites draw on the series' earlier artwork, while a replacement soundtrack changes the feel of familiar locations. LibertyTwins' FireRed project pairs that presentation with versions that offer different amounts of gameplay change, letting players choose how close to the original experience they want to stay.\n\nThe fuller editions add flexible exploration, day-and-night changes and practical conveniences such as reusable resources and improved team management. The Normal version also rebalances Pokémon and type interactions, while the Faithful version keeps official Pokémon data closer to its familiar form. A separate Music & Graphics Only patch focuses on presentation. This listing covers v1.2, so check which variant the linked package contains before following encounter or battle advice; features are not identical across all three editions.",
    "sources": [
      "https://romhackguides.com/hacks/aesthetic-red/",
      "https://romhackhub.com/hacks/pokemon-aesthetic-red/"
    ]
  },
  {
    "id": "b6093f5e-9f33-47a2-893c-3b7f1eb82647",
    "title": "Pokémon Fire of Sky — v1.0.3",
    "previousDescription": "Set in a time long before Trainers or Poké Balls, a young boy from humble beginnings sets off on an adventure with his unlikely partner. The two work together to uncover the mystery behind the sudden surge in rampaging Pokemon. The townspeople pray that Ho-Oh, their deity, will bring peace once more to their mountain village.",
    "description": "Pokémon Fire of Sky visits an age before Poké Balls and formal Pokémon Trainers. A young villager and an unlikely Pokémon companion leave home to investigate a wave of aggression among the surrounding creatures. Their mountain community looks to Ho-Oh for protection, giving the journey a quieter, mythic atmosphere than a modern trip to the Pokémon League.\n\nTeon's Emerald-based hack is a short, complete story, usually described as around one to two hours long. Following Pokémon reinforce the partnership at its centre, while passive healing during travel and move relearning from the summary screen keep attention on the adventure. Custom forms and graphics help establish the historical setting. Version 1.0.3 suits players looking for a contained narrative with a clear emotional focus, rather than a large collection of Gyms or a lengthy post-game challenge.",
    "sources": [
      "https://www.pokeharbor.com/2026/06/pokemon-fire-of-sky/",
      "https://www.romhackhub.com/hacks/pokemon-fire-of-sky/"
    ]
  },
  {
    "id": "6e0785c7-8baa-44d9-8eb3-8f0ba267f47a",
    "title": "Pokémon Adventures Red Chapter — Beta 15 + Expansion FIX C",
    "previousDescription": "Based on the Pokémon Adventures manga, Red Chapter follows Red’s journey through a story that is often closer to the manga’s events than the anime or main-series games. Familiar regions and characters return, but the plot, battles and events are rewritten around the manga’s cast and conflicts.",
    "description": "Pokémon Adventures Red Chapter follows Red through a FireRed-based adaptation of the Pokémon Adventures manga. Its characters, conflicts and important encounters draw on that version of the Pokémon world, giving familiar locations a different context from either the anime or the original games. Story chapters, scripted scenes and rewritten battles keep the focus on Red's developing journey.\n\nAethestode's project expands the adaptation with additional areas, events and original material, so it is more than a direct scene-for-scene retelling. Exploration and party-building support the narrative, with recognisable manga characters appearing throughout the adventure. Beta 15 plus Expansion FIX C is the established Volume 1 release, with the expansion and subsequent fixes extending and refining that volume. Its beta-style name does not mean this download contains every later chapter of the wider project; distinguish Volume 1 from the separate continuation when choosing a walkthrough or transferring progress.",
    "sources": [
      "https://www.gamebrew.org/index.php?title=Pokemon_Adventure_-_Red_Chapter_GBA",
      "https://romhackhub.com/hacks/pokemon-adventure-red-chapter/"
    ]
  },
  {
    "id": "0b2b8d9c-d7be-43b9-91f2-97c2dcf8e303",
    "title": "Pokémon Tourmaline — v1.1.1",
    "previousDescription": "Tourmaline introduces the Issho region, where a regional Pokédex full of new forms and original creatures changes the feel of an Emerald-based journey. Battles are built around a broader type system and new status conditions, while level caps help keep boss fights demanding. Version 1.1.1 also includes speed and interface improvements.",
    "description": "Pokémon Tourmaline explores Issho several years after the crisis involving Groudon and Kyogre. May, now assisting Pokémon research, helps begin a journey into a region full of unusual species and unexplained discoveries. A criminal organisation and its exceptionally powerful Pokémon add urgency to an adventure set in an alternate continuation of Emerald's world.\n\nThe custom regional Pokédex mixes familiar species with new regional forms, selected beta designs and original creatures. Echo joins the type chart, while new status conditions, weather, moves and abilities make battles feel different even when a Pokémon looks recognisable. Mega Evolution is not a standard battle mechanic here; some Mega designs instead return as natural evolutions. The v1.1.1 edition includes interface and speed improvements alongside the main adventure. Use Tourmaline's own battle information when building a team, since its alternate timeline deliberately changes several familiar rules.",
    "sources": [
      "https://www.pokecommunity.com/threads/pok%C3%A9mon-tourmaline-v1-1-1-released-02-09-2026.527425/"
    ]
  },
  {
    "id": "88182e87-a344-4ad1-a996-4ee05b87ed5a",
    "title": "Pokémon Gaia Version — v3.2",
    "previousDescription": "Gaia is a story-driven adventure in the Orbtus region, where an ancient civilization and the power of the mysterious Regi legends lie at the heart of a growing threat. The familiar Pokémon journey expands into a new region with its own mythology, ruins and characters, while the battle system borrows several modern features from later generations.",
    "description": "Pokémon Gaia takes place in Orbtus, where monuments and ruins are the remains of a civilisation destroyed by earthquakes. When seismic activity begins rising again, Professor Redwood asks new trainers to help investigate. Your journey through the region becomes a search for answers about its past and a race to prevent another disaster.\n\nSpherical Ice's FireRed-based adventure combines an original story with Pokémon from Kanto through Kalos and a modernised battle system. Mega Evolution, the Fairy type, updated abilities and a physical/special split broaden team-building without abandoning the feel of a traditional Pokémon RPG. Hidden areas, climbable terrain and underwater exploration encourage looking beyond the main road. Version 3.2 offers the main adventure through the League; do not assume it includes every post-game feature discussed for later development. It is a strong fit for players who enjoy regional mythology, exploration and a cohesive original setting.",
    "sources": [
      "https://www.pokecommunity.com/threads/pok%C3%A9mon-gaia-version.326118/"
    ]
  },
  {
    "id": "7145e3d2-e660-40f8-8cf2-3c13957058dd",
    "title": "Pokémon Radical Red — v4.1",
    "previousDescription": "Radical Red rebuilds Kanto into a demanding, strategy-focused adventure where Gym Leaders and major opponents use more competitive teams and modern battle systems. It keeps the familiar map and story foundation but adds extensive options for team-building, difficulty tuning and competitive-style battles, making even familiar encounters require planning.",
    "description": "Pokémon Radical Red turns the familiar Kanto journey into a sustained test of team-building. Its major trainers use carefully constructed teams, modern abilities and coordinated strategies, making preparation and adaptation more valuable than relying on one overlevelled favourite. The original FireRed map and story provide a recognisable framework, but the battle experience is substantially different.\n\nA greatly expanded roster and updated moves give you many ways to answer those challenges. Tools for finding Pokémon and preparing their stats reduce the time needed to try a new strategy, while difficulty and challenge options let you adjust the rules of a run. Mega Evolution and other version-specific systems add further decisions during important encounters. This entry covers the complete v4.1 release. Check documentation for your chosen mode, since restrictions, available tools and opposing teams can differ; ordinary FireRed walkthroughs will not explain its boss battles.",
    "sources": [
      "https://www.pokemoncoders.com/pokemon-radical-red/",
      "https://www.pokeharbor.com/2021/06/pokemon-radical-red/"
    ]
  },
  {
    "id": "a4688a8f-b9c8-4b37-bf2d-f771d8a42eb7",
    "title": "Pokémon The Red & Blue Sequel — v2.1.2",
    "previousDescription": "Set years after the original Red and Blue story, this sequel shifts the spotlight toward new mysteries around the Sevii Islands while bringing familiar characters into a later era of the Pokémon world. It builds on FireRed’s foundation with new plot events, new battles and a different perspective on characters players already know.",
    "description": "Pokémon The Red & Blue Sequel imagines Kanto five years after the original adventure. Familiar people have moved into a new chapter of their lives, while unexplained events around the Sevii Islands suggest that the region's story is far from over. The League journey leads toward those island mysteries, giving the campaign both a recognisable starting point and a reason to look beyond it.\n\nMatrixGBA, also known as SacredGBC, builds the sequel on FireRed with rewritten events, additional encounters and a wider cast drawn from later Pokémon games. New battles and story sequences encourage returning players to reconsider places they already know rather than follow the original route from memory. Version 2.1.2 is a complete release. Its appeal is the imagined future of the classic setting, with custom content and a broader Pokémon selection supporting that continuation rather than recreating Red and Blue unchanged.",
    "sources": [
      "https://www.pokeharbor.com/2023/08/pokemon-the-red-blue-sequel/"
    ]
  },
  {
    "id": "f71d7e96-f533-438a-b28f-bef1c3357468",
    "title": "Pokémon Flora Sky — v2.1",
    "previousDescription": "Flora Sky takes players through a modified Hoenn-style world where Team Magma, Team Aqua and a new threat become entangled with legendary Pokémon and unusual distortions. Its adventure introduces new areas and events alongside an expanded roster, creating a substantial classic-era hack with a large story and post-game content.",
    "description": "Pokémon Flora Sky builds an Emerald-based adventure around legendary Pokémon and a dangerous connection between the ordinary world and Giratina's realm. Team Magma and Team Aqua pursue their own ambitions as the disturbances spread, leaving a new trainer and their allies to navigate unfamiliar areas and prevent a larger crisis. Custom routes, scripted events and expanded encounters give the journey a different shape from Hoenn's original campaign.\n\nExploration continues beyond the central story through additional encounters and post-game events. There is an important edition distinction on this listing: although the title says Flora Sky v2.1, the preserved download link names Flora Sky Rebirth v01.03.22, a separate modified edition associated with Portuguese-language updates. Confirm the package's language and release notes before starting. Mechanics, translation coverage and save compatibility can differ between original Flora Sky and Rebirth, so their walkthroughs should not be treated as interchangeable.",
    "sources": [
      "https://www.pokeharbor.com/2021/05/pokemon-flora-sky-rebirth/",
      "https://pokebat.net/2022/03/pokemon-flora-sky-rebirth-pt-br-v057.html"
    ]
  },
  {
    "id": "25e18e0b-43c5-4c00-9390-53160e90a383",
    "title": "Pokémon Dark Worship (English translation) — English v2.8",
    "previousDescription": "Dark Worship takes the player to the Seafood region for a darker Pokémon journey involving an expanding threat and numerous side stories. It combines a new region and story with a large selection of starters and modern mechanics, giving the campaign a more challenging, feature-heavy feel than a standard FireRed adventure.",
    "description": "Pokémon Dark Worship takes you to the Seafood region, where the pursuit of a championship becomes entangled with a threatening sect and its interest in a powerful Pokémon. André Freitas' FireRed-based game combines that darker central conflict with new towns, characters and rewarding side quests, giving the region more to discover than its main battle route.\n\nA broad Pokémon selection and multiple modern battle systems provide plenty of ways to develop a team. Mega Evolution, Z-Moves and Dynamax-related features sit alongside difficulty choices and practical tools for exploration and preparation. This listing specifically covers the English v2.8 translation. Other language releases use different version numbers, and newer projects bearing the Dark Worship name are separate editions or games. Follow guidance for this English release when checking available content, since features advertised for Super Dark Worship or another later build may not apply here.",
    "sources": [
      "https://pokehostel.com/pokemon-dark-worship/",
      "https://www.romhackhub.com/hacks/pokemon-dark-worship/"
    ]
  },
  {
    "id": "10b6dfb8-b7ad-4e10-8478-5f142d958d61",
    "title": "Pokémon Blue Stars 4",
    "previousDescription": "Set in the Shinstar region, the story begins with Mewtwo on the run from an Evil organization that wants Mewtwo’s power to revive a terrible Pokémon.\n\nEmbark on a quest to claim the title of the mightiest champion and defeat the nefarious Team Cosmic, an evil organization hell-bent on harnessing Mewtwo’s power to resurrect a perilous Pokémon.\n\nAlong this journey, you’ll encounter both familiar faces and fresh allies, each adding their unique essence to this gripping tale of adventure.",
    "description": "Pokémon Blue Stars 4 follows a new adventure in Shinstar, where Team Cosmic is hunting Mewtwo to use its power in a dangerous resurrection. Your championship journey intersects with that pursuit, bringing new allies and familiar Pokémon characters into a story that stretches beyond earning badges. Jean Stars' FireRed-based game gives the conflict its own region and Gym Leaders.\n\nThe expanded roster includes later-generation Pokémon and regional forms, with Mega Evolution, Z-Moves, Dynamax and Gigantamax adding variety to important battles. Normal, Hard and Expert settings work alongside a level-cap system to shape the challenge. DexNav, shared experience and a Rotom Phone with convenient PC and shop access reduce interruptions while exploring. Side quests and Pokémon GO-inspired PokéStops provide additional activities. The complete game offers English, Brazilian Portuguese and Spanish options, making language selection part of choosing the right release for your playthrough.",
    "sources": [
      "https://www.pokeharbor.com/2023/06/pokemon-blue-stars-4/",
      "https://pokehostel.com/pokemon-blue-stars-4/"
    ]
  },
  {
    "id": "cd91eaa0-4c90-4564-8464-fa97f3944d7c",
    "title": "Pokémon R.O.W.E. (Real Open World Experience) — Mega Update — v1.9.4 Source Edition",
    "previousDescription": "R.O.W.E. rebuilds Hoenn as an open-world adventure, letting players choose where to travel and which Gym to challenge rather than follow the original badge order. The region retains its familiar geography but adds a much more flexible progression system, modern mechanics and a large set of quality-of-life features. The Mega Update refers to the project’s Mega Evolution feature/update rather than a separate unrelated hack.",
    "description": "Pokémon R.O.W.E. changes Hoenn's progression into an open-world journey. You choose where to travel and which Gym to approach, building a route around your interests and team rather than following Emerald's fixed badge order. Familiar geography becomes a space for planning your own adventure, with updated mechanics and a broader Pokémon selection supporting different ways to play.\n\nQuality-of-life systems and configurable challenge options reduce the friction of exploring out of order. The Mega Update adds another layer to team-building through Mega Evolution, while the project's wider changes make ordinary Emerald advice an incomplete guide to progression. This listing links the v1.9.4 Source Edition repository: it contains source code and links to project information, so it should not be mistaken for a ready-to-run game file. Follow the project's patching or build guidance and use documentation matching the release you intend to play.",
    "sources": [
      "https://github.com/Iamdivinefox/Rowe"
    ]
  },
  {
    "id": "64f9a88e-d07a-4c94-8670-412e0bf82196",
    "title": "Pokémon The Pit — Roguelite Style Hack — v2.5.1",
    "previousDescription": "The Pit turns Pokémon battling into a floor-by-floor roguelite gauntlet inspired by Paper Mario’s Pit of 100 Trials. Each floor sends you into trainer battles that scale with your progress, with shops and tutors between fights and major bosses at regular intervals. Players can choose among rulesets based on different Pokémon generations, battle formats and difficulty options, or attempt a shorter run.",
    "description": "Pokémon The Pit turns Emerald into a roguelite battle gauntlet inspired by Paper Mario's Pit of 100 Trials. Each floor pushes your team further, with rising opponent levels, periodic bosses and opportunities to shop or adjust moves between stretches of combat. The central question is how far your current strategy can carry you, rather than where the next town or Gym will be.\n\nGeneration-based rulesets, singles and doubles formats, randomisation and difficulty settings let you shape each attempt. A shorter 50-floor option offers a more compact run, while the full challenge rewards sustained planning across 100 floors. Version 2.5.1 adds more opportunities to change your party through the Pit Stop's trade system. This is a complete battle-focused experience by archie and co-lead Wiz, with replay value coming from different teams, rules and decisions made during the climb.",
    "sources": [
      "https://romhackguides.com/hacks/the-pit/",
      "https://www.pokecommunity.com/threads/the-pit-v2-roguelite-style-hack.528423/page-6"
    ]
  },
  {
    "id": "baf3ca11-02ea-4d2c-be30-5acd212ef3ee",
    "title": "Pokémon Let’s Go Pikachu GBA",
    "previousDescription": "A GBA reimagining of Pokémon: Let’s Go, Pikachu!, bringing the Kanto adventure into the classic FireRed engine with updated visuals, modern Pokémon mechanics and content spanning multiple generations. Pikachu is your partner, wild Pokémon can appear outside the grass, and the adventure includes new maps, characters, events, Mega Evolution and regional forms. Version 8.1 is the latest Spanish base-hack release identified in the source material. An English translation patch was released in October 2026, providing roughly 99% English text; some artwork-based labels remain Spanish and the original hack’s bugs are not all fixed.",
    "description": "Pokémon Let's Go Pikachu GBA brings a partner-Pikachu adventure to FireRed's handheld framework. Kevin PokeFan's reinterpretation takes inspiration from the Switch game while adding its own maps, events and modern Pokémon options. Visible wild encounters, regional forms and Mega Evolution make the familiar Kanto journey feel different from a standard FireRed playthrough.\n\nThis entry links the English patch package for the v8.1 base hack, translated by Logical-Puddings. The translation covers approximately 99 percent of ordinary game text, including dialogue, battle information and descriptions, although some labels embedded in artwork remain Spanish. The package offers translation-only and translation-with-fixes variants. Those small fixes do not amount to a complete repair of every issue in the original hack. Check the supplied patch order and base-game requirements before starting, and keep a backup if moving an existing save to the translated edition.",
    "sources": [
      "https://retrododo.com/lets-go-pikachu-eevee-gba-demake-now-has-an-english-translation/",
      "https://retro-computers.co.uk/2026/10/21/gba-pokemon-demake-of-lets-go-gets-english-translation/"
    ]
  }
];
