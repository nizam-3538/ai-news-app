const fs = require('fs');
const path = require('path');
const { screen } = require('@testing-library/dom');

describe('Login Page', () => {
  beforeEach(() => {
    const html = fs.readFileSync(path.resolve(__dirname, '../login.html'), 'utf8');
    document.body.innerHTML = html;
  });

  test('should display the login form', () => {
    expect(screen.getByPlaceholderText('Enter your email')).not.toBeNull();
    expect(screen.getByPlaceholderText('Enter your password')).not.toBeNull();
    expect(screen.getByRole('button', { name: /Sign In/i })).not.toBeNull();
  });
});
