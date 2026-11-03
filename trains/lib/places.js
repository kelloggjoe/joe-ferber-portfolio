// Local details beside stations, plus a few spots of their own. Each one
// is a 7x7 icon (colours from PALETTE in eggs.js) with a hover caption.

export const ICONS = {
  tree: ["..ggg..", ".ggggg.", "ggggggg", "gggdggg", ".ggggg.", "...n...", "..nnn.."],
  cap: ["...u...", ".uuuuu.", "uuuuuuu", ".uuuuup", "..uuu.p", "..uuu.p", "......."],
  book: [".......", "lllllll", "lwwlwwl", "lwwlwwl", "lwwlwwl", "lllllll", "......."],
  lighthouse: ["...r...", "..ppp..", "..www..", "..rrr..", "..www..", ".rrrrr.", "bbbbbbb"],
  museum: ["...b...", "..bbb..", "bbbbbbb", "b.b.b.b", "b.b.b.b", "b.b.b.b", "bbbbbbb"],
  dino: ["....ss.", "....sxs", "...sss.", "sssss..", ".ssss..", ".s..s..", "......."],
  fish: [".......", "...ee..", "e.eeee.", "eeeeexe", "e.eeee.", "...ee..", "......."],
  planet: [".......", "..uuu..", ".uuuuu.", "ppppppp", ".uuuuu.", "..uuu..", "......."],
  plane: ["...w...", "...w...", ".wwwww.", "wwwwwww", "...w...", "..www..", "......."],
  music: ["..ppppp", "..p...p", "..p...p", "..p...p", "ppp.ppp", "ppp.ppp", "......."],
  hotdog: ["..g.g..", ".ppppp.", "rrrrrrr", "ryryryr", ".ppppp.", ".......", "......."],
  pizza: ["ppppppp", "prrgrrp", ".prrrp.", ".prgrp.", "..prp..", "...p...", "......."],
  star: ["...p...", "..ppp..", "ppppppp", ".ppppp.", "..ppp..", ".pp.pp.", "p.....p"],
  mask: [".wwwww.", "wwwwwww", "wxwwwxw", "wwwwwww", "wxwwwxw", "wwxxxww", ".wwwww."],
  basketball: ["..eee..", ".eexee.", "eeexeee", "xxxxxxx", "eeexeee", ".eexee.", "..eee.."],
  football: [".......", "..nnn..", ".nnwnn.", "nnwwwnn", ".nnwnn.", "..nnn..", "......."],
  baseball: ["..www..", ".rwwwr.", "wrwwwrw", "wrwwwrw", "wrwwwrw", ".rwwwr.", "..www.."],
  umbrella: ["..rwr..", ".rwrwr.", "rwrwrwr", "...b...", "...b...", "...b...", "ppppppp"],
  cross: ["..rrr..", "..rrr..", "rrrrrrr", "rrrrrrr", "rrrrrrr", "..rrr..", "..rrr.."],
  dome: ["...w...", "..www..", ".wwwww.", "wwwwwww", "w.w.w.w", "wwwwwww", "......."],
  bag: ["..b.b..", ".b...b.", "ooooooo", "ooooooo", "ooooooo", "ooooooo", "......."],
  painting: ["ppppppp", "pllllyp", "plllllp", "pgllggp", "pgggggp", "ppppppp", "......."],
  paw: [".n.n.n.", ".......", "..nnn..", ".nnnnn.", ".nnnnn.", "..n.n..", "......."],
  sign: ["ggggggg", "gwwwwwg", "ggggggg", "...b...", "...b...", "...b...", "......."],
  rock: [".......", "..uuu..", ".uuyuu.", "uuuuuyu", "uyuuuuu", "uuuuuuu", "......."],
  building: ["..kkk..", "..kyk..", ".kkkkk.", ".kykyk.", ".kkkkk.", ".kykyk.", ".kkkkk."],
  tower: ["...s...", "..sss..", "..sss..", ".sssss.", ".s.s.s.", "sssssss", "sssssss"],
  lantern: ["...p...", "..rrr..", ".rrrrr.", ".rpppr.", ".rrrrr.", "..rrr..", "...p..."],
  bowl: [".w...w.", "..w.w..", "ppppppp", "lllllll", ".lllll.", "..lll..", "......."],
  bunting: ["bbbbbbb", "rrlluue", "rrlluue", ".r.l.u.", ".......", ".......", "......."],
  flamingo: ["..rrr..", ".r...r.", "r..r..r", "r.r.r.r", "r.r.r.r", "r.r.r.r", "......."],
  picasso: ["..nnn..", ".n...n.", "n.nnn.n", "n.n.n.n", ".nnnnn.", "..n.n..", ".nn.nn."],
  maypole: ["...p...", "..rbg..", ".r.b.g.", "r..b..g", "...b...", "...b...", "..bbb.."],
  greenhouse: ["...w...", "..wcw..", ".wcccw.", "wcccccw", "wcgcgcw", "wwwwwww", "......."],
  train: [".......", ".lllll.", "lwlwlwl", "lllllll", "lllllll", ".x...x.", "......."],
  house: [".......", "nnnnnnn", ".bbbbb.", ".bybyb.", ".bbbbb.", "bbbbbbb", "......."],
  fountain: ["...c...", "..c.c..", ".c.c.c.", "c..c..c", "bbbbbbb", ".bbbbb.", "......."],
  column: ["...p...", "...w...", "..www..", "..www..", "..www..", ".wwwww.", "wwwwwww"],
  dala: ["....rr.", "...rrr.", "rrrrrr.", "rrrrr..", "rprrr..", ".r..r..", "......."],
  rainbow: [".......", "..rrr..", ".reeer.", "reyyyer", "eyg.gye", "yg...gy", "gl...lg"],
};

// station: exact station name; line: a line that stops there; branch picks
// the north or south one when a line has two stations of that name. Major
// places show from the city-wide view (see tierOf).
export const STATION_PLACES = [
  // Evanston and Wilmette
  { station: "Linden", line: "p", icon: "dome", major: true, label: "Bahá'í House of Worship", note: "Wilmette's nine-sided temple" },
  { station: "Central", line: "p", icon: "football", major: true, label: "Ryan Field", note: "Northwestern football" },
  { station: "Noyes", line: "p", icon: "painting", label: "Noyes Cultural Arts Center" },
  { station: "Foster", line: "p", icon: "cap", major: true, label: "Northwestern University", note: "campus is a few blocks east" },
  { station: "Davis", line: "p", icon: "fountain", label: "Fountain Square", note: "downtown Evanston" },
  { station: "Dempster", line: "p", icon: "umbrella", label: "Dempster Street Beach" },
  { station: "Main", line: "p", icon: "bag", label: "Main-Dempster Mile", note: "Evanston's shopping strip" },
  { station: "Howard", line: "red", icon: "sign", label: "Howard Street", note: "where Chicago meets Evanston" },
  // Skokie
  { station: "Dempster-Skokie", line: "y", icon: "sign", label: "Skokie" },
  { station: "Oakton-Skokie", line: "y", icon: "building", label: "Illinois Science + Technology Park" },
  // Red Line, north to south
  { station: "Jarvis", line: "red", icon: "sign", label: "Rogers Park" },
  { station: "Morse", line: "red", icon: "painting", label: "Glenwood Avenue Arts District" },
  { station: "Loyola", line: "red", icon: "cap", major: true, label: "Loyola University Chicago" },
  { station: "Granville", line: "red", icon: "sign", label: "Edgewater" },
  { station: "Bryn Mawr", line: "red", icon: "umbrella", label: "Osterman Beach" },
  { station: "Berwyn", line: "red", icon: "dala", label: "Andersonville", note: "Swedish roots on Clark Street" },
  { station: "Argyle", line: "red", icon: "bowl", label: "Argyle Street", note: "pho and banh mi row" },
  { station: "Lawrence", line: "red", icon: "music", label: "Aragon Ballroom and the Green Mill" },
  { station: "Wilson", line: "red", icon: "cap", label: "Truman College" },
  { station: "Sheridan", line: "red", icon: "tree", label: "Graceland Cemetery" },
  { station: "Belmont", line: "red", icon: "rainbow", label: "Northalsted" },
  { station: "Fullerton", line: "red", icon: "cap", major: true, label: "DePaul University" },
  { station: "North/Clybourn", line: "red", icon: "star", label: "Steppenwolf Theatre" },
  { station: "Clark/Division", line: "red", icon: "umbrella", label: "Oak Street Beach" },
  { station: "Chicago", line: "red", icon: "tower", label: "Chicago Water Tower", note: "survived the 1871 fire" },
  { station: "Grand", line: "red", icon: "bag", major: true, label: "The Magnificent Mile" },
  { station: "Lake", line: "red", icon: "sign", label: "State Street", note: "that great street" },
  { station: "Monroe", line: "red", icon: "building", label: "Palmer House" },
  { station: "Jackson", line: "red", icon: "flamingo", label: "Calder's Flamingo", note: "Federal Plaza" },
  { station: "Harrison", line: "red", icon: "book", label: "Printers Row" },
  { station: "Cermak-Chinatown", line: "red", icon: "lantern", major: true, label: "Chinatown" },
  { station: "Sox-35th", line: "red", icon: "baseball", major: true, label: "Rate Field", note: "home of the White Sox" },
  { station: "79th", line: "red", icon: "sign", label: "Chatham" },
  { station: "95th/Dan Ryan", line: "red", icon: "cap", label: "Chicago State University" },
  // Blue Line
  { station: "O'Hare", line: "blue", icon: "plane", major: true, label: "O'Hare International Airport" },
  { station: "Rosemont", line: "blue", icon: "building", label: "Rosemont's convention center" },
  { station: "Harlem", line: "blue", branch: "north", icon: "sign", label: "Norwood Park" },
  { station: "Jefferson Park", line: "blue", icon: "star", label: "Copernicus Center" },
  { station: "Irving Park", line: "blue", icon: "sign", label: "Old Irving Park" },
  { station: "Addison", line: "blue", icon: "sign", label: "Avondale" },
  { station: "Logan Square", line: "blue", icon: "column", label: "Illinois Centennial Monument" },
  { station: "Damen", line: "blue", icon: "tree", label: "The 606", note: "the old rail line, now a trail" },
  { station: "Division", line: "blue", icon: "fountain", label: "Polish Triangle" },
  { station: "Clark/Lake", line: "blue", icon: "building", label: "City Hall" },
  { station: "Washington", line: "blue", icon: "picasso", label: "The Picasso", note: "Daley Plaza" },
  { station: "LaSalle", line: "blue", icon: "building", label: "Chicago Board of Trade" },
  { station: "Clinton", line: "blue", icon: "train", major: true, label: "Union Station" },
  { station: "UIC-Halsted", line: "blue", icon: "cap", major: true, label: "University of Illinois Chicago" },
  { station: "Racine", line: "blue", icon: "pizza", label: "Little Italy", note: "Taylor Street" },
  { station: "Illinois Medical District", line: "blue", icon: "cross", label: "Illinois Medical District" },
  { station: "Austin", line: "blue", icon: "tree", label: "Columbus Park" },
  { station: "Forest Park", line: "blue", icon: "sign", label: "Forest Park" },
  // Brown Line
  { station: "Kimball", line: "brn", icon: "sign", label: "Albany Park" },
  { station: "Kedzie", line: "brn", icon: "cap", label: "North Park University" },
  { station: "Francisco", line: "brn", icon: "sign", label: "Ravenswood Manor" },
  { station: "Western", line: "brn", icon: "maypole", label: "Lincoln Square", note: "maypole and all" },
  { station: "Paulina", line: "brn", icon: "sign", label: "Lakeview" },
  { station: "Southport", line: "brn", icon: "star", label: "Music Box Theatre" },
  { station: "Armitage", line: "brn", icon: "sign", label: "Lincoln Park" },
  { station: "Sedgwick", line: "brn", icon: "mask", label: "The Second City" },
  { station: "Chicago", line: "brn", icon: "painting", label: "River North galleries" },
  { station: "Merchandise Mart", line: "brn", icon: "building", label: "The Merchandise Mart" },
  // The Loop
  { station: "Harold Washington Library-State/Van Buren", line: "brn", icon: "book", label: "Harold Washington Library" },
  { station: "Adams/Wabash", line: "brn", icon: "painting", major: true, label: "Art Institute of Chicago" },
  { station: "Washington/Wabash", line: "brn", icon: "tree", major: true, label: "Millennium Park" },
  { station: "State/Lake", line: "brn", icon: "star", label: "The Chicago Theatre" },
  // Green Line
  { station: "Oak Park", line: "g", icon: "house", label: "Frank Lloyd Wright Home and Studio" },
  { station: "Ridgeland", line: "g", icon: "sign", label: "Oak Park" },
  { station: "Central", line: "g", icon: "sign", label: "Austin" },
  { station: "Pulaski", line: "g", icon: "sign", label: "West Garfield Park" },
  { station: "Conservatory", line: "g", icon: "greenhouse", label: "Garfield Park Conservatory" },
  { station: "Kedzie", line: "g", icon: "sign", label: "East Garfield Park" },
  { station: "Damen", line: "g", icon: "basketball", major: true, label: "United Center", note: "Bulls and Blackhawks" },
  { station: "Ashland", line: "g", icon: "tree", label: "Union Park" },
  { station: "Morgan", line: "g", icon: "bowl", label: "Fulton Market" },
  { station: "Clinton", line: "g", icon: "train", label: "Ogilvie Transportation Center" },
  { station: "Roosevelt", line: "g", icon: "sign", label: "Museum Campus", note: "a walk east" },
  { station: "Cermak-McCormick Place", line: "g", icon: "building", label: "McCormick Place" },
  { station: "35th-Bronzeville-IIT", line: "g", icon: "cap", label: "Illinois Institute of Technology" },
  { station: "43rd", line: "g", icon: "sign", label: "Bronzeville" },
  { station: "51st", line: "g", icon: "tree", label: "Washington Park" },
  { station: "Garfield", line: "g", icon: "museum", label: "DuSable Black History Museum" },
  { station: "Cottage Grove", line: "g", icon: "cap", major: true, label: "University of Chicago", note: "just to the north" },
  { station: "King Drive", line: "g", icon: "sign", label: "Woodlawn" },
  { station: "Halsted", line: "g", icon: "sign", label: "Englewood" },
  { station: "Ashland/63rd", line: "g", icon: "sign", label: "West Englewood" },
  // Orange Line
  { station: "Midway", line: "o", icon: "plane", major: true, label: "Midway Airport" },
  { station: "35th/Archer", line: "o", icon: "tree", label: "McKinley Park" },
  { station: "Halsted", line: "o", icon: "sign", label: "Bridgeport" },
  // Pink Line
  { station: "18th", line: "pnk", icon: "bunting", label: "Pilsen", note: "murals and papel picado" },
  { station: "Polk", line: "pnk", icon: "cross", label: "Rush University Medical Center" },
  { station: "California", line: "pnk", icon: "tree", label: "Douglass Park" },
  { station: "Central Park", line: "pnk", icon: "sign", label: "North Lawndale" },
  { station: "Cicero", line: "pnk", icon: "sign", label: "Cicero" },
];

// Places that aren't at a station.
export const SPOTS = [
  { lat: 42.0640, lon: -87.6769, icon: "lighthouse", label: "Grosse Point Lighthouse", note: "lit since 1873" },
  { lat: 42.0517, lon: -87.6766, icon: "rock", label: "The Rock", note: "Northwestern's most painted boulder" },
  { lat: 42.0523, lon: -87.6743, icon: "book", label: "Deering Library", note: "Northwestern" },
  { lat: 42.0573, lon: -87.6713, icon: "building", major: true, label: "Kellogg Global Hub", note: "Kellogg School of Management" },
  { lat: 41.9211, lon: -87.6340, icon: "paw", major: true, label: "Lincoln Park Zoo", note: "free since 1868" },
  { lat: 41.9145, lon: -87.6243, icon: "umbrella", label: "North Avenue Beach" },
  { lat: 41.8924, lon: -87.6267, icon: "pizza", label: "Pizzeria Uno", note: "deep dish since 1943" },
  { lat: 41.8676, lon: -87.6140, icon: "fish", major: true, label: "Shedd Aquarium" },
  { lat: 41.8663, lon: -87.6068, icon: "planet", major: true, label: "Adler Planetarium", note: "America's first planetarium" },
  { lat: 41.8663, lon: -87.6170, icon: "dino", major: true, label: "Field Museum", note: "home of SUE the T. rex" },
  { lat: 41.8623, lon: -87.6167, icon: "football", major: true, label: "Soldier Field", note: "home of the Bears" },
  { lat: 41.8660, lon: -87.6447, icon: "hotdog", label: "Jim's Original", note: "Maxwell Street Polish since 1939" },
  { lat: 41.9973, lon: -87.7871, icon: "hotdog", label: "Superdawg", note: "drive-in since 1948" },
];

// 1: major, on the map from the city-wide view. 2: notable, from part-way
// in. 3: neighbourhood signs, a small marker until you're at street level.
export function tierOf(p) {
  return p.major ? 1 : p.icon === "sign" ? 3 : 2;
}

// Attach each entry to its station.
export function resolvePlaces(places, stations) {
  return places.map((p) => {
    let hits = stations.filter((s) => s.name === p.station && s.l.includes(p.line));
    if (hits.length > 1 && p.branch) {
      hits.sort((a, b) => a.y - b.y);
      hits = [p.branch === "north" ? hits[0] : hits[hits.length - 1]];
    }
    if (hits.length !== 1) throw new Error(`${p.station} on ${p.line}: ${hits.length} matches`);
    return { ...p, station: hits[0] };
  });
}
