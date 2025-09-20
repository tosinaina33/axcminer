// pages/market.js
import { supabase } from '../supabaseClient.js';

export default async function render(container) {
  container.innerHTML = `
    <div class="card">
      <h2 class="text-xl font-bold mb-2">Market</h2>
      <p class="text-sm text-gray-400 mb-4">Choose your mining bot</p>
      <div id="bot-list" class="space-y-4"></div>
    </div>
  `;

  const list = container.querySelector("#bot-list");

  // ✅ Fetch all bots
  const { data: bots, error } = await supabase.from("mining_bots").select("*");
  if (error) {
    list.innerHTML = `<div class="text-red-400">❌ Failed to load bots: ${error.message}</div>`;
    return;
  }

  if (!bots || bots.length === 0) {
    list.innerHTML = `<div>No bots available.</div>`;
    return;
  }

  // ✅ Render bots
  list.innerHTML = bots.map(bot => `
    <div class="card flex items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        ${bot.img_url ? `<img src="${bot.img_url}" alt="${bot.name}" class="w-16 h-16 rounded-lg object-cover">` : ""}
        <div>
          <div class="font-bold">${bot.name}</div>
          <div class="text-xs text-gray-400">
            Duration: ${bot.duration_days} days • ROI: ${bot.roi ?? 0}%<br>
            Points: ${bot.points ?? 0} • Power: ${bot.hash_rate ?? "—"}
          </div>
        </div>
      </div>
      <div class="text-right">
        <div class="font-bold mb-2">$${bot.price}</div>
        <button class="btn buy-btn" data-id="${bot.id}">Buy</button>
      </div>
    </div>
  `).join("");

  // ✅ Handle Buy button click
  document.querySelectorAll(".buy-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const botId = btn.dataset.id;
      const bot = bots.find(b => b.id == botId);
      if (!bot) return;

      btn.disabled = true;
      btn.innerText = "Processing...";

      const success = await buyBot(bot);

      if (success) {
        btn.innerText = "Bought ✅";
      } else {
        btn.disabled = false;
        btn.innerText = "Buy";
      }
    });
  });
}

// ✅ Buy logic
async function buyBot(bot) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    alert("⚠️ Please login first.");
    return false;
  }

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("Profile fetch error:", profileError);
    alert("❌ Failed to load profile.");
    return false;
  }

  if (profile.balance < bot.price) {
    alert("⚠️ Insufficient balance.");
    return false;
  }

  const newBalance = profile.balance - bot.price;

  // Deduct balance first
const { data: updateData, error: balanceError } = await supabase
  .from("profiles")
  .update({ balance: newBalance })
  .eq("id", user.id);

if (balanceError) {
  console.error("Balance update error:", balanceError);
  alert("❌ Failed to deduct balance.");
  return false;
}

console.log("Balance updated:", updateData);

  // Insert mining order
  const { error: orderError } = await supabase.from("mining_orders").insert({
    user_id: user.id,
    bot_id: bot.id,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + bot.duration_days * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    earnings: 0,
    settings: {
      roi: bot.roi ?? 0,
      price: bot.price,
      duration: bot.duration_days,
      power: bot.hash_rate ?? null
    }
  });

  if (orderError) {
    console.error("Order insert error:", orderError);

    // ⚠️ Restore balance if insert fails
    await supabase.from("profiles").update({ balance: profile.balance }).eq("id", user.id);

    alert("❌ Failed to create mining order.");
    return false;
  }

  alert(`✅ You successfully bought ${bot.name} for $${bot.price}!`);
  return true;
}