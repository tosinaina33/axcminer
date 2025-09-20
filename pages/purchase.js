// pages/purchase.js
export default async function render(container){
  container.innerHTML = `
    <div class="card">
      <h2 class="text-xl font-bold">Purchase / Deposit</h2>
      <p class="text-sm text-gray-300 mt-1">Send USDT (or supported coin) to this wallet address. After you deposit, create a support ticket or wait for admin to verify.</p>
      <div class="mt-4 p-3 bg-[#081017] rounded">
        <div class="font-bold">USDT (TRC20)</div>
        <div class="text-sm mt-2 break-words">REPLACE_WITH_YOUR_WALLET_ADDRESS</div>
        <div class="mt-3"><button class="btn" id="copier">Copy Address</button></div>
      </div>
    </div>
  `;

  document.getElementById('copier').addEventListener('click', async () => {
    const addr = 'REPLACE_WITH_YOUR_WALLET_ADDRESS';
    await navigator.clipboard.writeText(addr);
    alert('Address copied to clipboard');
  });
}