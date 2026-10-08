document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

    button.classList.add('active');
    const tabId = `${button.dataset.tab}-tab`;
    document.getElementById(tabId).classList.add('active');
  });
});

function showLoading() {
  document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

function openModal(modalId) {
  document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

async function loadDashboardStats() {
  try {
    const roomsResponse = await fetch('/api/rooms');
    const rooms = await roomsResponse.json();

    const transactionsResponse = await fetch('/api/cashflow');
    const cashflow = await transactionsResponse.json();

    document.getElementById('total-rooms').textContent = rooms.length;
    document.getElementById('occupied-rooms').textContent = rooms.filter(r => r.status === 'TERISI').length;
    document.getElementById('monthly-income').textContent = `Rp${cashflow.monthlyIncome.toLocaleString()}`;
    document.getElementById('balance').textContent = `Rp${cashflow.balance.toLocaleString()}`;
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

async function saveRoom() {
  const room = {
    id: document.getElementById('room-id').value,
    rent: parseInt(document.getElementById('room-rent').value),
    status: document.getElementById('room-status').value
  };

  if (!room.id || !room.rent) {
    alert('Please fill all required fields');
    return;
  }

  showLoading();
  try {
    await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(room)
    });

    alert('Room saved successfully!');
    document.getElementById('room-id').value = '';
    document.getElementById('room-rent').value = '';
    loadDashboardStats();
    loadRoomsTable();
  } catch (error) {
    alert('Error saving room: ' + error.message);
  } finally {
    hideLoading();
  }
}

async function loadRoomsTable() {
  showLoading();
  try {
    const response = await fetch('/api/rooms');
    const rooms = await response.json();

    let html = '<table class="table"><thead><tr><th>ID</th><th>Rent</th><th>Status</th><th>Actions</th></tr></thead><tbody>';

    rooms.forEach(room => {
      const statusClass = room.status === 'TERISI' ? 'status-terisi' :
                     room.status === 'MENUNGGAK' ? 'status-menunggak' : 'status-kosong';

      html += `<tr>
          <td>${room.id}</td>
          <td>Rp${(room.rent || 0).toLocaleString()}</td>
          <td class="${statusClass}">${room.status}</td>
          <td>
              <button onclick="editRoom('${room.id}', ${room.rent}, '${room.status}')" class="btn-warning" style="padding: 5px 10px; width: auto;">Edit</button>
              <button onclick="deleteRoom('${room.id}')" class="btn-danger" style="padding: 5px 10px; width: auto;">Delete</button>
          </td>
      </tr>`;
    });

    html += '</tbody></table>';
    document.getElementById('rooms-table-container').innerHTML = html;
  } catch (error) {
    console.error('Error loading rooms:', error);
  } finally {
    hideLoading();
  }
}

function editRoom(id, rent, status) {
  document.getElementById('room-id').value = id;
  document.getElementById('room-rent').value = rent;
  document.getElementById('room-status').value = status;
}

async function deleteRoom(id) {
  if (confirm('Are you sure you want to delete this room?')) {
    showLoading();
    try {
      await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
      alert('Room deleted successfully!');
      loadDashboardStats();
      loadRoomsTable();
    } catch (error) {
      alert('Error deleting room: ' + error.message);
    } finally {
      hideLoading();
    }
  }
}

async function saveTenant() {
  const tenant = {
    id: document.getElementById('tenant-id').value,
    name: document.getElementById('tenant-name').value,
    phone: document.getElementById('tenant-phone').value,
    email: document.getElementById('tenant-email').value,
    paymentStatus: document.getElementById('tenant-payment-status').value
  };

  if (!tenant.id || !tenant.name || !tenant.phone) {
    alert('Please fill all required fields');
    return;
  }

  showLoading();
  try {
    await fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tenant)
    });

    alert('Tenant saved successfully!');
    document.getElementById('tenant-id').value = '';
    document.getElementById('tenant-name').value = '';
    document.getElementById('tenant-phone').value = '';
    document.getElementById('tenant-email').value = '';
    loadTenantsTable();
  } catch (error) {
    alert('Error saving tenant: ' + error.message);
  } finally {
    hideLoading();
  }
}

async function loadTenantsTable() {
  showLoading();
  try {
    const response = await fetch('/api/tenants');
    const tenants = await response.json();

    let html = '<table class="table"><thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Email</th><th>Payment Status</th><th>Actions</th></tr></thead><tbody>';

    tenants.forEach(tenant => {
      const statusClass = tenant.paymentStatus === 'LUNAS' ? 'status-lunas' : 'status-belum-lunas';

      html += `<tr>
          <td>${tenant.id}</td>
          <td>${tenant.name}</td>
          <td>${tenant.phone}</td>
          <td>${tenant.email}</td>
          <td class="${statusClass}">${tenant.paymentStatus}</td>
          <td>
              <button onclick="editTenant('${tenant.id}', '${tenant.name}', '${tenant.phone}', '${tenant.email}', '${tenant.paymentStatus}')" class="btn-warning" style="padding: 5px 10px; width: auto;">Edit</button>
              <button onclick="deleteTenant('${tenant.id}')" class="btn-danger" style="padding: 5px 10px; width: auto;">Delete</button>
          </td>
      </tr>`;
    });

    html += '</tbody></table>';
    document.getElementById('tenants-table-container').innerHTML = html;
  } catch (error) {
    console.error('Error loading tenants:', error);
  } finally {
    hideLoading();
  }
}

function editTenant(id, name, phone, email, paymentStatus) {
  document.getElementById('tenant-id').value = id;
  document.getElementById('tenant-name').value = name;
  document.getElementById('tenant-phone').value = phone;
  document.getElementById('tenant-email').value = email;
  document.getElementById('tenant-payment-status').value = paymentStatus;
}

async function deleteTenant(id) {
  if (confirm('Are you sure you want to delete this tenant?')) {
    showLoading();
    try {
      await fetch(`/api/tenants/${id}`, { method: 'DELETE' });
      alert('Tenant deleted successfully!');
      loadTenantsTable();
    } catch (error) {
      alert('Error deleting tenant: ' + error.message);
    } finally {
      hideLoading();
    }
  }
}

async function generateWaReminder() {
  const roomId = document.getElementById('billing-room-select').value;
  const amount = document.getElementById('billing-amount').value;

  if (!roomId || !amount) {
    alert('Please select room and enter amount');
    return;
  }

  showLoading();
  try {
    const response = await fetch('/api/whatsapp-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, amount: parseInt(amount) })
    });

    const data = await response.json();

    if (data.success) {
      document.getElementById('billing-result').innerHTML = `
          <div style="background: rgba(46, 204, 113, 0.2); padding: 15px; border-radius: 10px; margin-top: 15px;">
              <p><strong>WhatsApp Reminder Generated!</strong></p>
              <p><a href="${data.waLink}" target="_blank" style="color: #3498db; text-decoration: underline;">Click here to send reminder</a></p>
              <p style="font-style: italic; margin-top: 10px;">Message preview: ${data.message}</p>
          </div>
      `;
    } else {
      alert('Error generating reminder: ' + data.error);
    }
  } catch (error) {
    alert('Error generating reminder: ' + error.message);
  } finally {
    hideLoading();
  }
}

async function openAIAdvisor() {
  showLoading();
  try {
    const response = await fetch('/api/ai-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const data = await response.json();

    if (data.success) {
      document.getElementById('ai-advisor-result').innerHTML = `
          <div style="margin-bottom: 20px;">
              <h4 style="color: #f1c40f;">Recommendations:</h4>
              <ul>
                  ${data.advice.recommendations.map(rec => `<li>${rec}</li>`).join('')}
              </ul>
          </div>
          <div style="margin-bottom: 20px;">
              <h4 style="color: #f1c40f;">Financial Insights:</h4>
              <p><strong>Monthly Cashflow:</strong> ${data.advice.financialInsights.monthlyCashflow}</p>
              <p><strong>Overdue Payments:</strong> ${data.advice.financialInsights.overduePayments}</p>
              <p><strong>Occupancy Rate:</strong> ${data.advice.financialInsights.occupancyRate}</p>
          </div>
          <div>
              <h4 style="color: #f1c40f;">Risk Factors:</h4>
              <ul>
                  ${data.advice.riskFactors.map(risk => `<li>${risk}</li>`).join('')}
              </ul>
          </div>
      `;
      openModal('ai-modal');
    } else {
      alert('Error getting AI advice: ' + data.error);
    }
  } catch (error) {
    alert('Error getting AI advice: ' + error.message);
  } finally {
    hideLoading();
  }
}

async function recordTransaction() {
  const transaction = {
    type: document.getElementById('transaction-type').value,
    amount: parseInt(document.getElementById('transaction-amount').value),
    category: document.getElementById('transaction-category').value,
    notes: document.getElementById('transaction-notes').value
  };

  if (!transaction.type || !transaction.amount || !transaction.category) {
    alert('Please fill all required fields');
    return;
  }

  showLoading();
  try {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction)
    });

    const data = await response.json();

    if (data.success) {
      alert('Transaction recorded successfully!');
      document.getElementById('transaction-amount').value = '';
      document.getElementById('transaction-category').value = '';
      document.getElementById('transaction-notes').value = '';
      loadDashboardStats();
      loadTransactionsTable();
    } else {
      alert('Error recording transaction: ' + data.error);
    }
  } catch (error) {
    alert('Error recording transaction: ' + error.message);
  } finally {
    hideLoading();
  }
}

async function loadTransactionsTable() {
  showLoading();
  try {
    const response = await fetch('/api/transactions');
    const transactions = await response.json();

    let html = '<table class="table"><thead><tr><th>Type</th><th>Amount</th><th>Category</th><th>Date</th><th>Notes</th><th>Actions</th></tr></thead><tbody>';

    transactions.forEach(transaction => {
      const date = new Date(transaction.timestamp || transaction.date).toLocaleDateString();
      const amountText = transaction.type === 'income' ?
          `Rp${transaction.amount.toLocaleString()}` :
          `-Rp${Math.abs(transaction.amount).toLocaleString()}`;
      const typeColor = transaction.type === 'income' ? '#2ecc71' : '#e74c3c';

      html += `<tr>
          <td style="color: ${typeColor}; font-weight: bold;">${transaction.type.toUpperCase()}</td>
          <td style="color: ${typeColor};">${amountText}</td>
          <td>${transaction.category}</td>
          <td>${date}</td>
          <td>${transaction.notes || '-'}</td>
          <td>
              <button onclick="deleteTransaction('${transaction.id}')" class="btn-danger" style="padding: 5px 10px; width: auto;">Delete</button>
          </td>
      </tr>`;
    });

    html += '</tbody></table>';
    document.getElementById('transactions-table-container').innerHTML = html;
  } catch (error) {
    console.error('Error loading transactions:', error);
  } finally {
    hideLoading();
  }
}

async function deleteTransaction(id) {
  if (confirm('Are you sure you want to delete this transaction?')) {
    showLoading();
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      alert('Transaction deleted successfully!');
      loadDashboardStats();
      loadTransactionsTable();
    } catch (error) {
      alert('Error deleting transaction: ' + error.message);
    } finally {
      hideLoading();
    }
  }
}

async function populateRoomDropdown() {
  try {
    const response = await fetch('/api/rooms');
    const rooms = await response.json();

    const select = document.getElementById('billing-room-select');
    select.innerHTML = '<option value="">Select Room</option>';

    rooms.forEach(room => {
      const option = document.createElement('option');
      option.value = room.id;
      option.textContent = `Room ${room.id} - Rp${(room.rent || 0).toLocaleString()}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error populating room dropdown:', error);
  }
}

loadDashboardStats();
loadRoomsTable();
loadTenantsTable();
loadTransactionsTable();
populateRoomDropdown();

window.onclick = function(event) {
  const modals = ['ai-modal', 'loading'];
  modals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
};