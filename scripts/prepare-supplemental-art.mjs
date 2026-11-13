import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Concrete subjects and directly visible actions, selected from the supplemental vocabulary.
// Function words, proper names and concepts requiring symbolic diagrams stay text-only.
const selected = new Set(`abdomen appliance artisan artwork ash attic backyard baker barrier basil bathwater baton batter beekeeper belongings bleach blink boiler bolt breadcrumb brooch bun cactus café camel campfire candlelight canopy caregiver carer carpenter cart catapult cellar chandelier chapel charger checkout cheque chessboard cinnamon cleaning climber clinician clothesline clutter coastline cocoa collector commuter compass compost cookbook cooky cord crab craftspeople crater crayon crush cub cube dairy debris discus diver divider dock doorbell doorway dragon drain driveway droplet duckling dumpling dune dustpan earring eel ember farmhouse farmland fertiliser fingerprint fingertip fist flame flowerpot footwear frown fry galaxy germ ginger glacier goalkeeper goggle gown grandma grandpa graphite grassland greenery grinder guitarist hailstorm handlebar handrail handshake handwash hay hen hiker hilltop hood housing inhaler innkeeper interviewer jelly jeweller juggle kitten knead koala labourer lace lakeside landmark lawn leaf leftover lemonade lifeguard limb lotion machinery mannequin manuscript marketplace mash mattress memorial mentor moisturiser mooring mosque mosquitoes motorboat mould mower muddy muffin mural newborn newsroom nibble noodle orchard owl oxen paddle palette palm pathway peek pendulum petal pharmacist photographer plumber pollinate pollinator porcelain pothole pouch prism promenade prune pudding puddle puppet quilt rack radiator raindrop rainfall ramp ranger rattle rectangle referee refinery repaint repairer rescuer reservoir rider rink rinse riverbank riverbed roadside roadwork robe rooftop roommate rusty sandbag sandcastle scatter screw sculptor seabed seabird seasoning seaweed seedling seesaw sequin shatter shed shellfish shoelace shopkeeper shopper shuffle simmer sip skatepark sketch sketchbook skyline slope snowfall soak socket sourdough spade spoke spray sprinkler squeeze staircase stalk staple stethoscope sticker stockroom storyteller streetlight stretch submarine swimmer takeaway takeoff teammate thorn timer tong topsoil touchscreen trailer traveller trickle trot tumble twirl underwater unload unlock untie utensil velvet villager vine violinist waddle walker waterhole waterway wetland wig wildfire wildflower willow windowsill wizard woodland workbench workspace wriggle wrinkle yoghurt zip zoo`.split(/\s+/));
for (const word of 'archive dad drainage dropping ensemble fixture flatmate forage freshwater groundwater headteacher heatwave interior laser metalworking mining organism particle processor rainwater restorer scrap screening seawater sediment sensor shipbuilding sitter terrain valuables ventilation venue veterinary voyage wastewater weightlessness wholegrain wholemeal'.split(' ')) selected.add(word);
const style = 'Mid-century modern editorial illustration, like a plate from a vintage illustrated field guide. Strict limited palette: deep ink navy, warm terracotta, mustard ochre, muted sage green and soft sky blue on warm cream paper. Flat geometric shapes, confident clean silhouettes, subtle risograph grain and paper texture, gentle shading, one clear focal subject with generous negative space, centered square composition, calm and charming mood. Absolutely no text, letters, words, numbers, captions, signs, logos, watermarks or frames.';
const data = JSON.parse(fs.readFileSync(path.join(root, 'public/atlas/supplemental.json'), 'utf8'));
const previousPath = path.join(root, 'data/supplemental-art.json');
const previous = fs.existsSync(previousPath) ? JSON.parse(fs.readFileSync(previousPath, 'utf8')).assets : [];
const assets = data.entries.filter(e => selected.has(e.w)).map(e => {
  const prior = previous.find(a => a.id === e.id);
  return {
    id: e.id, word: e.w, status: prior?.status || 'pending',
    prompt: `Create one square vocabulary illustration for "${e.w}". Show a clear, recognizable concrete subject or visible action matching its use in this example: ${e.ex[0].en} (${e.ex[0].zh}). Dictionary meanings for context only: ${e.senses.map(s => s.zh).join('; ')}. Depict only the meaning used in the example, avoiding unrelated alternate definitions. The target word must be the unmistakable visual focus. Use a simple natural scene, not an infographic or collage. ${style}`,
    ...(prior?.source ? {source:prior.source} : {}),
  };
});
for (const asset of assets) {
  if (asset.status !== 'pending') asset.prompt = previous.find(a => a.id === asset.id)?.prompt || asset.prompt;
  else asset.prompt += ' Any people must wear ordinary clothing or appropriate work/sports attire.';
  if (asset.word === 'discus') asset.prompt = `One square vocabulary illustration of a discus: a single recognizable round athletics throwing disc, dark metallic rim and warm terracotta centre, resting beside a circular throwing area in a grassy sports field. Show the sports equipment clearly in the foreground. No people or sculpture. ${style}`;
}
const missing = [...selected].filter(w => !data.entries.some(e => e.w === w));
if (missing.length) throw Error(`Unknown words: ${missing.join(', ')}`);
fs.writeFileSync(previousPath, JSON.stringify({ generator: 'built-in image_gen', criteria: 'Concrete subjects and directly visible actions; abstract and function words remain text-only.', style, assets }, null, 2) + '\n');
console.log(`${assets.length} illustration prompts prepared.`);
