// pages/home.js
import { supabase } from '/supabaseClient.js';

export default async function render(container){
  container.innerHTML = `<div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <h2 class="text-xl font-bold">Home</h2>
        <p class="text-sm text-gray-300 mt-1">Overview & quick actions</p>
      </div>
      <div id="home-action"></div>
    </div>
    <div id="home-body" class="mt-4"></div>
  </div>`;

  // get user
  const { data: getUser } = await supabase.auth.getUser();
  const user = getUser?.user ?? null;

  const body = container.querySelector('#home-body');
  if(!user){
    body.innerHTML = `<p>Please register or login to access your dashboard.</p>`;
    container.querySelector('#home-action').innerHTML = `<button class="btn" onclick="location.href='/index.html'">Login</button>`;
    return;
  }

  // fetch profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const name = profile?.name ?? user.email;
  const balance = profile?.balance ?? 0;

  body.innerHTML = `
    <div class="mb-3">Welcome back, <strong>${name}</strong></div>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <div class="card"><div>Balance</div><div class="text-xl font-bold mt-2">$${balance}</div></div>
      <div class="card"><div>Active Bots</div><div class="text-xl font-bold mt-2" id="active-bots">Loading...</div></div>
    </div>
    <div class="mt-4"><button class="btn" data-goto="market">Buy Bot</button></div>
  `;

  // fetch active bots
  const { data: activeBots, error: activeError } = await supabase
    .from("mining_orders")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active");

  document.getElementById("active-bots").innerText = activeBots?.length || 0;

  // quick nav to market
  container.querySelectorAll('[data-goto="market"]').forEach(b => b.addEventListener('click', ()=> {
    // simulate nav click
    document.querySelector('[data-page="market"]').click();
  }));
}
