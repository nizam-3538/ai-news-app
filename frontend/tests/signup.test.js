const fs = require('fs');
const path = require('path');
const { screen } = require('@testing-library/dom');

describe('Signup Page', () => {
  beforeEach(() => {
    const html = fs.readFileSync(path.resolve(__dirname, '../signup.html'), 'utf8');
    document.body.innerHTML = html;
  });

  test('should display the signup form', () => {
    expect(screen.getByPlaceholderText('Choose a username')).not.toBeNull();
    expect(screen.getByPlaceholderText('Enter your email')).not.toBeNull();
    expect(screen.getByPlaceholderText('Create a strong password')).not.toBeNull();
    expect(screen.getByPlaceholderText('Confirm your password')).not.toBeNull();
    expect(screen.getByRole('button', { name: /Create Account/i })).not.toBeNull();
  });
});
