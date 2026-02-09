import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <App />,
          children: [
            {
              index: true,
              element: <div>Test Content</div>,
            },
          ],
        },
      ],
      {
        initialEntries: ['/'],
      }
    );

    render(<RouterProvider router={router} />);
    expect(screen.getByText('Test Content')).toBeDefined();
  });
});
