import { useState } from 'preact/hooks';
import { countryFor, tools, type CountryCode } from '../data/catalogue';

export default function GuidedFinder({ countryCode }: { countryCode: CountryCode }) {
  const country = countryFor(countryCode);
  const choices = tools.filter(tool => tool.country === countryCode);
  const [selected, setSelected] = useState(choices[0].id);
  const tool = choices.find(item => item.id === selected) || choices[0];
  return <aside class="guided-finder" aria-labelledby="finder-title">
    <p class="eyebrow">Find your starting point</p><h2 id="finder-title">Start with your situation.</h2><p class="finder-intro">A local calculation starts with local rules.</p>
    <label for="finder-country">Your country</label><div id="finder-country" class="fixed-country"><span>{country.name}</span><a href="/#countries">Change</a></div>
    <label for="finder-tool">What would you like to work out?</label><select id="finder-tool" value={selected} onChange={event => setSelected(event.currentTarget.value)}>{choices.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    <div class="finder-recommendation" aria-live="polite"><span class="micro">Your starting point</span><h3>{tool.name}</h3><p>{tool.next} · in preparation</p></div>
    <a class="primary-button" href={`#${tool.id}`}>See tool details <span aria-hidden="true">→</span></a>
    <p class="finder-note">Calculators will open here once their rates and worked examples have been checked.</p><a class="text-link" href="/methodology/">How the working will be shown ↗</a>
  </aside>;
}
