import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders expense tracker header', () => {
  render(<App />);
  const appElement = screen.getByText(/expense tracker/i);
  expect(appElement).toBeDefined();
});
