// Chicago landmarks for the map. Each one is a 7x7 icon (colours from
// PALETTE in eggs.js) with a hover caption.

export const ICONS = {
  tree: ["..ggg..", ".ggggg.", "ggggggg", "gggdggg", ".ggggg.", "...n...", "..nnn.."],
  cap: ["...u...", ".uuuuu.", "uuuuuuu", ".uuuuup", "..uuu.p", "..uuu.p", "......."],
  lighthouse: ["...r...", "..ppp..", "..www..", "..rrr..", "..www..", ".rrrrr.", "bbbbbbb"],
  museum: ["...b...", "..bbb..", "bbbbbbb", "b.b.b.b", "b.b.b.b", "b.b.b.b", "bbbbbbb"],
  dino: ["....ss.", "....sxs", "...sss.", "sssss..", ".ssss..", ".s..s..", "......."],
  fish: [".......", "...ee..", "e.eeee.", "eeeeexe", "e.eeee.", "...ee..", "......."],
  plane: ["...w...", "...w...", ".wwwww.", "wwwwwww", "...w...", "..www..", "......."],
  hotdog: ["..g.g..", ".ppppp.", "rrrrrrr", "ryryryr", ".ppppp.", ".......", "......."],
  star: ["...p...", "..ppp..", "ppppppp", ".ppppp.", "..ppp..", ".pp.pp.", "p.....p"],
  basketball: ["..eee..", ".eexee.", "eeexeee", "xxxxxxx", "eeexeee", ".eexee.", "..eee.."],
  football: [".......", "..nnn..", ".nnwnn.", "nnwwwnn", ".nnwnn.", "..nnn..", "......."],
  baseball: ["..www..", ".rwwwr.", "wrwwwrw", "wrwwwrw", "wrwwwrw", ".rwwwr.", "..www.."],
  umbrella: ["..rwr..", ".rwrwr.", "rwrwrwr", "...b...", "...b...", "...b...", "ppppppp"],
  dome: ["...w...", "..www..", ".wwwww.", "wwwwwww", "w.w.w.w", "wwwwwww", "......."],
  painting: ["ppppppp", "pllllyp", "plllllp", "pgllggp", "pgggggp", "ppppppp", "......."],
  paw: [".n.n.n.", ".......", "..nnn..", ".nnnnn.", ".nnnnn.", "..n.n..", "......."],
  building: ["..kkk..", "..kyk..", ".kkkkk.", ".kykyk.", ".kkkkk.", ".kykyk.", ".kkkkk."],
  tower: ["...s...", "..sss..", "..sss..", ".sssss.", ".s.s.s.", "sssssss", "sssssss"],
  lantern: ["...p...", "..rrr..", ".rrrrr.", ".rpppr.", ".rrrrr.", "..rrr..", "...p..."],
  picasso: ["..nnn..", ".n...n.", "n.nnn.n", "n.n.n.n", ".nnnnn.", "..n.n..", ".nn.nn."],
  greenhouse: ["...w...", "..wcw..", ".wcccw.", "wcccccw", "wcgcgcw", "wwwwwww", "......."],
  train: [".......", ".lllll.", "lwlwlwl", "lllllll", "lllllll", ".x...x.", "......."],
  house: [".......", "nnnnnnn", ".bbbbb.", ".bybyb.", ".bbbbb.", "bbbbbbb", "......."],
  column: ["...p...", "...w...", "..www..", "..www..", "..www..", ".wwwww.", "wwwwwww"],
  arch: ["ppppppp", "prrgrrp", "p.....p", "p.....p", "p.....p", "p.....p", "p.....p"],
};

// Places most Chicagoans would know, at their real locations. Tier 1 shows
// from the city-wide view; tier 2 waits until you zoom in, which keeps the
// busy middle of the city from piling up.
export const PLACES = [
  // Evanston and the North Shore
  { lat: 42.0741, lon: -87.6845, tier: 1, icon: "dome", label: "Bahá'í House of Worship", note: "Wilmette" },
  { lat: 42.0640, lon: -87.6769, tier: 1, icon: "lighthouse", label: "Grosse Point Lighthouse", note: "lit since 1873" },
  { lat: 42.0656, lon: -87.6925, tier: 1, icon: "football", label: "Ryan Field", note: "Northwestern football" },
  { lat: 42.0565, lon: -87.6753, tier: 1, icon: "cap", label: "Northwestern University" },
  { lat: 42.0573, lon: -87.6713, tier: 2, icon: "building", label: "Kellogg Global Hub", note: "Kellogg School of Management" },
  // North Side
  { lat: 41.9990, lon: -87.6580, tier: 1, icon: "cap", label: "Loyola University Chicago" },
  { lat: 41.9973, lon: -87.7871, tier: 1, icon: "hotdog", label: "Superdawg", note: "drive-in since 1948" },
  { lat: 41.9247, lon: -87.6553, tier: 1, icon: "cap", label: "DePaul University" },
  { lat: 41.9211, lon: -87.6340, tier: 1, icon: "paw", label: "Lincoln Park Zoo", note: "free since 1868" },
  { lat: 41.9145, lon: -87.6243, tier: 1, icon: "umbrella", label: "North Avenue Beach" },
  { lat: 41.9294, lon: -87.7076, tier: 1, icon: "column", label: "Logan Square", note: "the Illinois Centennial Monument" },
  { lat: 41.9045, lon: -87.7015, tier: 1, icon: "tree", label: "Humboldt Park" },
  // West
  { lat: 41.9786, lon: -87.9048, tier: 1, icon: "plane", label: "O'Hare International Airport" },
  { lat: 41.8944, lon: -87.7998, tier: 1, icon: "house", label: "Frank Lloyd Wright Home and Studio", note: "Oak Park" },
  { lat: 41.8863, lon: -87.7173, tier: 1, icon: "greenhouse", label: "Garfield Park Conservatory" },
  { lat: 41.8807, lon: -87.6742, tier: 1, icon: "basketball", label: "United Center", note: "Bulls and Blackhawks" },
  { lat: 41.8708, lon: -87.6505, tier: 1, icon: "cap", label: "University of Illinois Chicago" },
  { lat: 41.8560, lon: -87.6731, tier: 1, icon: "painting", label: "National Museum of Mexican Art", note: "Pilsen" },
  { lat: 41.8443, lon: -87.7050, tier: 1, icon: "arch", label: "Little Village Arch", note: "26th Street" },
  { lat: 41.7868, lon: -87.7522, tier: 1, icon: "plane", label: "Midway Airport" },
  // Downtown
  { lat: 41.8786, lon: -87.6403, tier: 2, icon: "train", label: "Union Station" },
  { lat: 41.8840, lon: -87.6301, tier: 2, icon: "picasso", label: "The Picasso", note: "Daley Plaza" },
  { lat: 41.8855, lon: -87.6272, tier: 2, icon: "star", label: "The Chicago Theatre" },
  { lat: 41.8972, lon: -87.6244, tier: 2, icon: "tower", label: "Chicago Water Tower", note: "survived the 1871 fire" },
  { lat: 41.8796, lon: -87.6237, tier: 1, icon: "painting", label: "Art Institute of Chicago" },
  { lat: 41.8663, lon: -87.6170, tier: 1, icon: "dino", label: "Field Museum", note: "home of SUE the T. rex" },
  { lat: 41.8676, lon: -87.6140, tier: 2, icon: "fish", label: "Shedd Aquarium" },
  { lat: 41.8623, lon: -87.6167, tier: 2, icon: "football", label: "Soldier Field", note: "home of the Bears" },
  { lat: 41.8517, lon: -87.6155, tier: 2, icon: "building", label: "McCormick Place" },
  // South Side
  { lat: 41.8530, lon: -87.6320, tier: 1, icon: "lantern", label: "Chinatown" },
  { lat: 41.8300, lon: -87.6339, tier: 1, icon: "baseball", label: "Rate Field", note: "home of the White Sox" },
  { lat: 41.7906, lon: -87.5831, tier: 1, icon: "museum", label: "Museum of Science and Industry" },
  { lat: 41.7886, lon: -87.5987, tier: 1, icon: "cap", label: "University of Chicago" },
  { lat: 41.7196, lon: -87.6097, tier: 1, icon: "cap", label: "Chicago State University" },
];
