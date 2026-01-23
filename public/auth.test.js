// Mocking necessary browser and fetch functionalities
global.fetch = jest.fn();
global.localStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => (store[key] = value.toString()),
    removeItem: (key) => delete store[key],
    clear: () => (store = {}),
  };
})();

document.body.innerHTML = '<div class="header-actions"></div>';

const { verifyTokenAndRenderHeader, renderGuestHeader, renderLoggedInHeader } = require('./auth.js');

describe('Authentication Logic', () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    fetch.mockClear();
    localStorage.clear();
    document.body.innerHTML = '<div class="header-actions"></div>';
  });

  test('should render guest header if no token is present', async () => {
    await verifyTokenAndRenderHeader();
    const header = document.querySelector('.header-actions');
    expect(header.innerHTML).toContain('Connexion');
    expect(header.innerHTML).toContain('S\'inscrire');
    expect(fetch).not.toHaveBeenCalled();
  });

  test('should render logged-in header if token is valid', async () => {
    const user = { fullname: 'Test User', role: 'user' };
    localStorage.setItem('token', 'valid-token');
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, user }),
    });

    await verifyTokenAndRenderHeader();

    const header = document.querySelector('.header-actions');
    expect(header.innerHTML).toContain('Profil');
    expect(header.innerHTML).toContain('Déconnexion');
    expect(localStorage.getItem('user')).toBe(JSON.stringify(user));
  });

  test('should render admin links if user is admin and token is valid', async () => {
    const adminUser = { fullname: 'Admin User', role: 'admin' };
    localStorage.setItem('token', 'valid-admin-token');
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, user: adminUser }),
    });

    await verifyTokenAndRenderHeader();

    const header = document.querySelector('.header-actions');
    expect(header.innerHTML).toContain('Gérer Agents');
    expect(header.innerHTML).toContain('Gérer Annonces');
  });

  test('should render guest header and clear localStorage if token is invalid', async () => {
    localStorage.setItem('token', 'invalid-token');
    localStorage.setItem('user', JSON.stringify({ fullname: 'Test User' })); // Stale user data
    fetch.mockResolvedValueOnce({
      ok: false,
    });

    await verifyTokenAndRenderHeader();

    const header = document.querySelector('.header-actions');
    expect(header.innerHTML).toContain('Connexion');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  test('should render guest header on fetch error', async () => {
    localStorage.setItem('token', 'valid-token');
    fetch.mockRejectedValueOnce(new Error('Network error'));

    await verifyTokenAndRenderHeader();

    const header = document.querySelector('.header-actions');
    expect(header.innerHTML).toContain('Connexion');
  });
});

// Mocking the DOMContentLoaded event listener
document.addEventListener = (event, callback) => {
  if (event === 'DOMContentLoaded') {
    callback();
  }
};
