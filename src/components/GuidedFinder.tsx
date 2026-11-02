import { useState } from 'preact/hooks';
import { countryFor, tools, type CountryCode } from '../data/catalogue';

export default function GuidedFinder({ countryCode }: { countryCode: CountryCode }) {
  const country = countryFor(countryCode);
  const choices = tools.filter(tool => tool.country === countryCode);
  const [selected, setSelected] = useState(choices[0].id);
  const tool = choices.find(item => item.id === selected) || choices[0];
  return <aside class="guided-finder" aria-labelledby="finder-title">
    <p class="eyebrow">Find your starting point</p><h2 id="finder-title">Start with your situation.</h2><p class="finder-intro">A local calculation starts with local rules.</p>
    <span class="finder-field-label" id="finder-country-label">Your country</span><div class="fixed-country" role="group" aria-labelledby="finder-country-label"><span>{country.name}</span><a href="/#countries" aria-label={`Change country from ${country.name}`}>Change</a></div>
    <label for="finder-tool">What would you like to work out?</label><select id="finder-tool" value={selected} onChange={event => setSelected(event.currentTarget.value)}>{choices.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    <div class="finder-recommendation" aria-live="polite"><span class="micro">Your starting point</span><h3>{tool.name}</h3><p>{tool.availability === 'beta' ? 'Interactive beta · human review pending' : `${tool.next} · in preparation`}</p></div>
    <a class="primary-button" href={tool.availability === 'beta' ? tool.path : `#${tool.id}`}>{tool.availability === 'beta' ? 'Open calculator' : 'See tool details'} <span aria-hidden="true">→</span></a>
    <p class="finder-note">{tool.availability === 'beta' ? 'This first version covers a limited wage-only estimate. Check its assumptions before using it.' : 'This tool is in preparation. Beta tools are labelled in the collection below.'}</p><a class="text-link" href="/methodology/">How the working is shown ↗</a>
  </aside>;
}
