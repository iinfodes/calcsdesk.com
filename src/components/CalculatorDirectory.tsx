import { useEffect, useState } from 'preact/hooks';
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
  const [includePlanned, setIncludePlanned] = useState(false);
  const [rememberCountry, setRememberCountry] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('calcsdesk-country');
      if (saved === 'all' || countries.some(item => item.code === saved)) {
        setCountry(saved as CountryCode | 'all');
        setRememberCountry(true);
      }
    } catch {}
  }, []);
  const chooseCountry = (next: CountryCode | 'all') => {
    setCountry(next);
    if (rememberCountry) { try { localStorage.setItem('calcsdesk-country', next); } catch {} }
  };
  const remember = (checked: boolean) => {
    setRememberCountry(checked);
    try { if (checked) localStorage.setItem('calcsdesk-country', country); else localStorage.removeItem('calcsdesk-country'); } catch {}
  };
  const results = tools.filter(tool => (includePlanned || tool.availability === 'beta') && (country === 'all' || tool.country === country) && matchesQuery(tool, query))
    .sort((a, b) => Number(b.availability === 'beta') - Number(a.availability === 'beta') || countries.findIndex(item => item.code === a.country) - countries.findIndex(item => item.code === b.country));
  return <>
    <section class="home-hero" aria-labelledby="home-title">
      <div class="hero-main">
        <p class="eyebrow">The money calculator desk</p>
        <h1 id="home-title">Money calculators.<br />See the working.</h1>
        <p class="lead">Explore limited US federal tax, UK monthly salary, UAE gratuity and India salary-regime betas. Follow the working, check the scope and see which other tools are still in preparation.</p>
        <form class="search-form" role="search" onSubmit={event => { event.preventDefault(); document.getElementById('directory-title')?.focus(); }}>
          <label for="calculator-search">Find a calculator</label>
          <div class="search-box"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10" cy="10" r="7" /><path d="m15 15 6 6" /></svg><input id="calculator-search" type="search" placeholder="Try “federal tax”" value={query} onInput={event => setQuery(event.currentTarget.value)} autoComplete="off" /><button class="search-submit" type="submit" aria-label="View matching calculators">↗</button></div>
        </form>
        <div class="country-chips" role="group" aria-label="Filter calculators by country"><button aria-pressed={country === 'all'} onClick={() => chooseCountry('all')}>All countries</button>{countries.map(item => <button key={item.code} aria-pressed={country === item.code} onClick={() => chooseCountry(item.code)}>{item.code === 'ae' ? 'UAE' : item.name}</button>)}</div>
        <label class="remember-country"><input type="checkbox" checked={rememberCountry} onChange={event => remember(event.currentTarget.checked)} />Remember my country filter on this device</label>
        <div class="quick-links"><a href="/us/tax/income-tax-calculator/">Open federal tax beta ↗</a><a href="#choose-tool">Choose the right tool ↓</a><a href="/updates/">Build updates ↗</a></div>
      </div>
      <aside class="proof-panel" aria-label="Our approach"><p class="eyebrow">A useful number has a clear explanation</p><ol><li><strong>Start with the scope.</strong><p>See what the beta includes and leaves out.</p></li><li><strong>Follow the working.</strong><p>Inspect inputs and each part of the estimate.</p></li><li><strong>Check the sources.</strong><p>Find the references and review status together.</p></li></ol><a class="text-link" href="/methodology/">Explore our approach →</a></aside>
    </section>
    <section id="calculators" class="directory-section" aria-labelledby="directory-title">
      <div class="section-heading"><div><p class="eyebrow">The calculator desk</p><h2 id="directory-title" tabIndex={-1}>Choose your starting point.</h2></div><span class="section-caption">Working beta first. Planned tools clearly labelled.</span></div>
      <label class="planned-toggle"><input type="checkbox" checked={includePlanned} onChange={event => setIncludePlanned(event.currentTarget.checked)} />Show tools in preparation</label>
      <p class="result-status" role="status">{`${results.length} matching ${results.length === 1 ? 'tool' : 'tools'}${includePlanned ? ', including tools in preparation' : ' available to try as a beta'}`}</p>
      {results.length > 0 ? <div class={`tool-grid ${results.length === 1 ? 'single-result' : ''}`}>{results.map(tool => <a class="tool-card" key={`${tool.country}-${tool.id}`} href={previewHref(tool)}><div class="tool-card-top"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d={paths[tool.task]} /></svg><span>{countryFor(tool.country).name}</span><span class="arrow" aria-hidden="true">↗</span></div><h3>{tool.name}</h3><span class="beta-tool-label">{tool.availability === 'beta' ? 'Interactive beta · human review pending' : 'In preparation · no calculation yet'}</span><p>{tool.description}</p><div class="card-next"><span>{tool.availability === 'beta' ? tool.next : 'View the tool plan'}</span><span aria-hidden="true">→</span></div></a>)}</div> : <div class="empty-state"><h3>{includePlanned ? 'No matching calculator yet.' : 'No matching beta calculator yet.'}</h3><p>Try “federal tax”, or enable tools in preparation to see what is being built. A planned tool does not produce a calculation.</p>{country !== 'all' && <a class="text-link" href={`/${country}/`}>View the {countryFor(country).name} collection →</a>}<button class="secondary-button" onClick={() => { setQuery(''); chooseCountry('all'); setIncludePlanned(false); }}>Clear search and filters</button></div>}
      <noscript><p class="field-hint">Beta links are available without JavaScript. Search and filters need JavaScript; the country links below remain available.</p></noscript>
    </section>
  </>;
}
