import { useState } from 'preact/hooks';
import { countries, countryFor, matchesQuery, previewHref, tools, type CountryCode } from '../data/catalogue';

const paths = {
  Pay: 'M4 7h16v13H4z M8 7V4h8v3 M4 12h16 M10 12v3h4v-3',
  Tax: 'M5 3h14v18l-3-2-4 2-4-2-3 2z M9 7h6 M9 11h6 M9 15h3',
  Benefits: 'M4 8h16v13H4z M3 8h18v4H3z M12 8v13 M12 8C5 8 6 1 9 3l3 5c7 0 6-7 3-5z',
  Loans: 'M3 20h18 M5 16V9 M12 16V4 M19 16v-5',
};

export default function CalculatorDirectory() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState<CountryCode | 'all'>('all');
  const results = tools.filter(tool => (country === 'all' || tool.country === country) && matchesQuery(tool, query));
  return <>
    <section class="home-hero" aria-labelledby="home-title">
      <div class="hero-main">
        <p class="eyebrow">The money calculator desk</p>
        <h1 id="home-title">Pay, tax and benefits.<br />See the working.</h1>
        <p class="lead">Find a paycheck, salary, tax or gratuity calculator for your country. Follow the steps behind the result.</p>
        <form class="search-form" role="search" onSubmit={event => { event.preventDefault(); document.getElementById('calculators')?.scrollIntoView({ block: 'start' }); }}>
          <label for="calculator-search">Find a calculator</label>
          <div class="search-box"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10" cy="10" r="7" /><path d="m15 15 6 6" /></svg><input id="calculator-search" type="search" placeholder="Try “UK salary” or “UAE gratuity”" value={query} onInput={event => setQuery(event.currentTarget.value)} autoComplete="off" /><button class="search-submit" type="submit" aria-label="View matching calculators">↗</button></div>
        </form>
        <div class="country-chips" role="group" aria-label="Filter calculators by country"><button aria-pressed={country === 'all'} onClick={() => setCountry('all')}>All countries</button>{countries.map(item => <button key={item.code} aria-pressed={country === item.code} onClick={() => setCountry(item.code)}>{item.code === 'ae' ? 'UAE' : item.name}</button>)}</div>
        <div class="quick-links"><span>Quick routes</span><a href="/us/tax/income-tax-calculator/">US federal tax · beta ↗</a><a href="/us/#paycheck">US paycheck ↗</a><a href="/uk/#salary">UK salary ↗</a><a href="/ae/#gratuity">UAE gratuity ↗</a></div>
      </div>
      <aside class="proof-panel" aria-label="Our approach"><p class="eyebrow">What should come with every result</p><ol><li><strong>The calculation</strong><p>Inputs and assumptions, made visible.</p></li><li><strong>The working</strong><p>A clear breakdown of each step.</p></li><li><strong>The source</strong><p>Official references beside the rates.</p></li></ol><a class="text-link" href="/methodology/">Explore our approach →</a></aside>
    </section>
    <section id="calculators" class="directory-section" aria-labelledby="directory-title">
      <div class="section-heading"><div><p class="eyebrow">The calculator desk</p><h2 id="directory-title">What brings you to the desk?</h2></div><span class="section-caption">Beta tools & launch collection ↘</span></div>
      <p class="result-status" role="status">{country !== 'all' || query ? `${results.length} matching ${results.length === 1 ? 'tool' : 'tools'} in the collection` : 'Try the first beta calculator or explore the tools in preparation.'}</p>
      {results.length > 0 ? <div class="tool-grid">{results.map(tool => <a class="tool-card" key={`${tool.country}-${tool.id}`} href={previewHref(tool)}><div class="tool-card-top"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d={paths[tool.task]} /></svg><span>{countryFor(tool.country).name}</span><span class="arrow" aria-hidden="true">↗</span></div><h3>{tool.name}</h3>{tool.availability === 'beta' && <span class="beta-tool-label">Interactive beta</span>}<p>{tool.description}</p><div class="card-next"><span>{tool.next}</span><span aria-hidden="true">→</span></div></a>)}</div> : <div class="empty-state"><h3>No matching calculator in this collection.</h3><p>Try “pay”, “tax” or a country name, or clear the filters to explore the planned tools.</p><button class="secondary-button" onClick={() => { setQuery(''); setCountry('all'); }}>Clear search and filters</button></div>}
    </section>
  </>;
}
