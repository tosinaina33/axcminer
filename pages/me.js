// pages/me.js
import { supabase } from "../supabaseClient.js";

export default async function render(container) {
  const { data: getUser } = await supabase.auth.getUser();
  const user = getUser?.user;

  if (!user) {
    container.innerHTML = `<div class="card p-4 text-center">⚠️ Please login first to access your profile.</div>`;
    return;
  }

  // ✅ Fetch profile info
  let profile = null;
  const { data, error: profileError } = await supabase
    .from("profiles")
    .select("balance, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profileError && data) profile = data;

  container.innerHTML = `
    <div class="card">
      <div class="flex items-center gap-4 mb-4">
        <img id="user-avatar" 
             src="${profile?.avatar_url || "/img/avatar.png"}" 
             class="w-12 h-12 rounded-full cursor-pointer" 
             alt="Your avatar"
             title="Click to change avatar">
        <input type="file" id="avatar-input" accept="image/*" class="hidden">

        <div>
          <div class="font-bold">${user.email}</div>
          <div class="text-xs text-gray-400">Balance: $${profile?.balance || 0}</div>
        </div>
      </div>

      <!-- Grid menu -->
      <div class="grid grid-cols-4 gap-4 text-center" id="meMenu">
        ${makeCube("mining.gif", "Mining", "mining")}
        ${makeCube("tracking.png", "Tracking", "tracking")}
        ${makeCube("referral.png", "Referral", "referral")}
        ${makeCube("transactions.png", "Transactions", "transactions")}
        ${makeCube("withdrawal.png", "Withdrawal", "withdrawal")}
        ${makeCube("bind.png", "Bind Account", "bind")}
        ${makeCube("payment.png", "Payment Services", "payment")}
        ${makeCube("settings.png", "Settings", "settings")}
      </div>

      <div id="meContent" class="mt-6"></div>
    </div>
  `;

  // ========== AVATAR UPLOAD HANDLER ==========
  const avatarImg = document.getElementById("user-avatar");
  const avatarInput = document.getElementById("avatar-input");

  avatarImg.addEventListener("click", () => {
    avatarInput.click();
  });

  avatarInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const originalSrc = avatarImg.src;
    avatarImg.src = "loading.gif";

    const filePath = `${user.id}/${Date.now()}_${file.name}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = await supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      avatarImg.src = urlData.publicUrl;
      alert("✅ Avatar updated successfully!");

    } catch (err) {
      console.error("Avatar upload failed:", err);
      avatarImg.src = originalSrc;
      alert("❌ Failed to update avatar. Please try again.");
    }
  });

  // ========== CUBE CLICK HANDLERS ==========
  document.querySelectorAll(".cube-btn").forEach((cube) => {
    cube.addEventListener("click", () => {
      loadSection(cube.dataset.key);
    });
  });

  // ========== LOAD SECTION CONTENT ==========
  async function loadSection(key) {
    const content = document.getElementById("meContent");
    content.innerHTML = `<div class="card p-4">Loading ${key}...</div>`;

    try {
      switch (key) {
        case "mining": {
          const { data: orders, error } = await supabase
            .from("mining_orders")
            .select("bot_id, start_date, end_date, status")
            .eq("user_id", user.id)
            .order("start_date", { ascending: false });

          if (error) throw error;

          content.innerHTML = renderList(
            "Your Mining Bots",
            orders,
            (o) => `Bot #${o.bot_id} — ${o.status} (ends ${new Date(o.end_date).toLocaleDateString()})`
          );
          break;
        }

        case "tracking": {
          const { data, error } = await supabase
            .from("tracking")
            .select("*")
            .eq("user_id", user.id);
          if (error) throw error;
          content.innerHTML = renderList(
            "Tracking",
            data,
            (t) => `${t.metric}: ${t.value}`
          );
          break;
        }

        case "referral": {
          const { data: referrals, error } = await supabase
            .from("referrals")
            .select("id, referred_user_id, created_at")
            .eq("referrer_id", user.id);

          if (error) throw error;

          const copyBtn = `
            <button id="copy-referral" class="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded">Copy</button>
          `;

          let html = `
            <div class="card p-4">
              <div class="mb-3">
                <div class="font-bold">Your Referral ID</div>
                <div class="flex items-center mt-1">
                  <span id="referral-id" class="font-mono text-sm">${user.id}</span>
                  ${copyBtn}
                </div>
              </div>
          `;

          if (!referrals || referrals.length === 0) {
            html += `<div>No referrals yet</div>`;
          } else {
            html += `
              <div class="font-bold mb-2">Your Subordinates</div>
              <ul class="space-y-1 text-sm">
                ${referrals
                  .map(
                    (r) =>
                      `<li>• ${r.referred_user_id} (joined ${new Date(
                        r.created_at
                      ).toLocaleDateString()})</li>`
                  )
                  .join("")}
              </ul>
            `;
          }
          html += `</div>`;
          content.innerHTML = html;

          document.getElementById("copy-referral").addEventListener("click", () => {
            navigator.clipboard.writeText(user.id).then(() => {
              const btn = document.getElementById("copy-referral");
              btn.textContent = "Copied!";
              setTimeout(() => (btn.textContent = "Copy"), 1500);
            });
          });
          break;
        }

        case "transactions": {
          const { data, error } = await supabase
            .from("transactions")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          if (error) throw error;
          content.innerHTML = renderList(
            "Transactions",
            data,
            (tx) => `${tx.type} — $${tx.amount} (${tx.status})`
          );
          break;
        }

        case "withdrawal": {
          const { data, error } = await supabase
            .from("withdrawals")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          if (error) throw error;
          content.innerHTML = renderList(
            "Withdrawals",
            data,
            (w) => `${w.method}: $${w.amount} (${w.status})`
          );
          break;
        }

        case "bind": {
          const { data, error } = await supabase
            .from("accounts")
            .select("*")
            .eq("user_id", user.id);
          if (error) throw error;
          content.innerHTML = renderList(
            "Bound Accounts",
            data,
            (a) => `${a.type}: ${a.details}`
          );
          break;
        }

        case "payment": {
          const { data, error } = await supabase.from("payments").select("*");
          if (error) throw error;
          content.innerHTML = renderList(
            "Payment Services",
            data,
            (p) => `${p.name}: ${p.status}`
          );
          break;
        }

        case "settings":
          content.innerHTML =
            "<div class='card p-4'>Account & notification settings...</div>";
          break;

        default:
          content.innerHTML = "";
      }
    } catch (err) {
      showError(content, err);
    }
  }

  // ========== HELPERS ==========
  function renderList(title, rows, mapper) {
    if (!rows || rows.length === 0)
      return `<div class="card p-4">${title}: No records yet.</div>`;
    return `
      <div class="card p-4">
        <div class="font-bold mb-2">${title}</div>
        <ul class="space-y-1 text-sm">
          ${rows.map(mapper).map((item) => `<li>• ${item}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  function showError(container, error) {
    container.innerHTML = `<div class="card p-4 text-red-400">❌ ${error.message || "Something went wrong"}</div>`;
  }
}

// ========== CUBE GENERATOR ==========
function makeCube(iconUrl, label, key) {
  return `
    <div class="cube-btn card cursor-pointer p-3 flex flex-col items-center justify-center transition-transform hover:scale-105 active:scale-95" data-key="${key}">
      <img src="${iconUrl}" class="w-8 h-8 mb-2 opacity-90 hover:opacity-100" alt="${label}" />
      <div class="text-xs font-medium text-gray-200">${label}</div>
    </div>
  `;
}