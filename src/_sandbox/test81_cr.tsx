import { Hono } from 'hono'
import { html } from 'hono/html'

export const test81 = new Hono<{ Bindings: { SUPERCELL_API_KEY: string } }>()

class ClashRoyaleService {
  constructor(private apiKey: string) {}

  private async fetchAPI(endpoint: string) {
    const res = await fetch(`https://api.clashroyale.com/v1${endpoint}`, {
      headers: { Authorization: `Bearer ${this.apiKey}`, Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  }

  async getPlayerData(tag: string) {
    return this.fetchAPI(`/players/${tag.replace('#', '%23')}`);
  }

  async getBattleLog(tag: string) {
    return this.fetchAPI(`/players/${tag.replace('#', '%23')}/battlelog`);
  }
}

test81.get('/', async (c) => {
  const service = new ClashRoyaleService(c.env.SUPERCELL_API_KEY);
  const PLAYER_TAG = '#G9YV9GR8R';

  try {
    const [p, logs]: [any, any] = await Promise.all([
      service.getPlayerData(PLAYER_TAG),
      service.getBattleLog(PLAYER_TAG)
    ]);

    return c.html(html`
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 650px; margin: 20px auto; background: #121212; color: #eee; padding: 25px; border-radius: 24px;">
        
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="font-size: 2rem; margin: 0; color: #ffd700;">${p.name}</h1>
          <p style="color: #888; margin: 5px 0;">Current Trophies: 🏆 ${p.trophies}</p>
        </div>

        <h3 style="font-size: 1rem; color: #aaa; margin-bottom: 15px; border-left: 4px solid #4caf50; padding-left: 10px;">RECENT BATTLES (Last 5)</h3>
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 30px;">
          ${logs.slice(0, 5).map((log: any) => {
            const team = log.team[0];
            const opponent = log.opponent[0];
            const isWin = team.crowns > opponent.crowns;
            const resultColor = isWin ? '#4caf50' : '#f44336';
            const resultText = isWin ? 'WIN' : 'LOSS';

            return html`
              <div style="background: #1e1e1e; padding: 12px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border-right: 6px solid ${resultColor};">
                <div style="flex: 1;">
                  <div style="font-size: 0.7rem; color: ${resultColor}; font-weight: bold;">${resultText}</div>
                  <div style="font-weight: bold;">vs ${opponent.name}</div>
                  <div style="font-size: 0.75rem; color: #777;">${log.type}</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 1.2rem; font-weight: bold; letter-spacing: 2px;">
                    ${team.crowns} - ${opponent.crowns}
                  </div>
                  <div style="font-size: 0.7rem; color: #555;">${new Date(log.battleTime.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6')).toLocaleTimeString()}</div>
                </div>
              </div>
            `;
          })}
        </div>

        <h3 style="font-size: 1rem; color: #aaa; margin-bottom: 15px; border-left: 4px solid #1a73e8; padding-left: 10px;">ACTIVE DECK</h3>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
          ${p.currentDeck.map((card: any) => html`
            <div style="background: #252525; padding: 5px; border-radius: 8px; text-align: center;">
              <img src="${card.iconUrls.medium}" style="width: 100%; height: auto;" />
            </div>
          `)}
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <button onclick="window.location.reload()" style="background: transparent; border: 1px solid #555; color: #888; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 0.8rem;">
            Refresh Logs
          </button>
        </div>
      </div>
    `)
  } catch (err: any) {
    return c.text(`Error: ${err.message}`);
  }
})