import React from 'react';
import mockFetch from 'unfetch';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../../../../test/utils';
import Raffle from '../Raffle';

const mockWinners = Array.from(Array(2), (_, idx) => ({
  name: `Pickle Rick ${idx}`,
  photoURL: `https://i.imgur.com/3VhMoBD.png?i=${idx}`,
  profileURL: `https://en.wikipedia.org/wiki/Pickle_Rick?i=${idx}`,
}));

const params = { meetup: 'foo', count: '2' };
const urlParams = new URLSearchParams(params).toString();
const drawUrlMatcher = `end:/draw?${urlParams}`;

describe('Raffle', () => {
  const { localStorage } = global.window;

  const fillOutForm = () => {
    // find elements
    const meetupInput = screen.getByLabelText(/meetup name/i);
    const countInput = screen.getByLabelText(/number of winners/i);

    // fill out form
    fireEvent.change(meetupInput, { target: { value: params.meetup } });
    fireEvent.change(countInput, { target: { value: params.count } });
  };

  const submitForm = async () => {
    const drawButton = screen.getByRole('button', { name: 'Draw' });

    // submit form
    fireEvent.click(drawButton);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.window.localStorage.clear();
    mockFetch.restore();
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  it('renders', () => {
    render(<Raffle />);

    expect(
      screen.getByRole('textbox', { name: /meetup name/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /number of winners/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /decrement/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /increment/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Draw' })).toBeInTheDocument();
  });

  it('restores data from localStorage (if available)', () => {
    const firstRender = render(<Raffle />);
    expect(
      parseInt(screen.getByLabelText(/Number of winners/i).value, 10),
    ).not.toBe(5);
    firstRender.unmount();

    localStorage.setItem('count', 5);
    render(<Raffle />);

    expect(
      parseInt(screen.getByLabelText(/Number of winners/i).value, 10),
    ).toBe(5);
  });

  it('submits and persists data to localStorage (if available)', async () => {
    mockFetch.get(drawUrlMatcher, { winners: mockWinners });
    render(<Raffle />);

    expect(mockFetch).toHaveFetchedTimes(0);
    expect(localStorage.getItem('count')).toBeNull();

    fillOutForm();
    await submitForm();

    await waitFor(() => {
      expect(mockFetch).toHaveFetched(drawUrlMatcher);
    });
    const countInStorage = localStorage.getItem('count');
    expect(countInStorage).toBe(params.count);
  });

  it('shows an error message on malformed response', async () => {
    mockFetch.get(drawUrlMatcher, { garbage: 'json' });
    render(<Raffle />);

    fillOutForm();
    await submitForm();

    await screen.findByText(/malformed response/i);
  });

  it('shows API-provided error messages', async () => {
    mockFetch.get(drawUrlMatcher, {
      status: 404,
      body: { error: { message: 'Sorry, something went awry.' } },
    });
    render(<Raffle />);

    fillOutForm();
    await submitForm();

    await screen.findByText(/awry/i);
  });

  it('resets the form on reset button click', async () => {
    mockFetch.get(drawUrlMatcher, { winners: mockWinners });
    render(<Raffle />);

    fillOutForm();
    await submitForm();

    await screen.findByText(mockWinners[0].name);
    fireEvent.click(screen.getByRole('button', { name: 'Start Over' }));

    expect(screen.queryByText(mockWinners[0].name)).toBeNull();
    expect(screen.getByRole('button', { name: 'Draw' })).toBeInTheDocument();
  });

  it('draws again on retry button click', async () => {
    mockFetch.get(drawUrlMatcher, { winners: mockWinners });
    render(<Raffle />);

    fillOutForm();
    await submitForm();

    await screen.findByText(mockWinners[0].name);
    fireEvent.click(screen.getByRole('button', { name: 'Draw Again' }));

    await waitFor(() => {
      expect(screen.queryByText(mockWinners[0].name)).toBeNull();
    });
    expect(
      screen.getByRole('button', { name: 'Start Over' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Draw Again' }),
    ).toBeInTheDocument();
  });

  it('selects current meetup input text on focus', async () => {
    render(<Raffle />);
    const meetupInput = screen.getByLabelText(/meetup name/i);

    expect(meetupInput.selectionStart).toBe(0);
    expect(meetupInput.selectionEnd).toBe(0);

    fillOutForm();
    fireEvent.focus(meetupInput);

    expect(meetupInput.selectionStart).toBe(0);
    expect(meetupInput.selectionEnd).toBe(meetupInput.value.length);
  });

  it('disables the Draw button while the inputs are invalid', () => {
    render(<Raffle />);
    const meetupInput = screen.getByLabelText(/meetup name/i);
    const countInput = screen.getByLabelText(/number of winners/i);
    const drawButton = screen.getByRole('button', { name: 'Draw' });

    // meetup: invalid, count: valid
    fireEvent.change(meetupInput, { target: { value: '' } });
    fireEvent.change(countInput, { target: { value: params.count } });
    expect(meetupInput).not.toHaveValue();
    expect(countInput).toHaveValue(params.count);
    expect(drawButton).toBeDisabled();

    // meetup: valid, count: invalid
    fireEvent.change(meetupInput, { target: { value: params.meetup } });
    fireEvent.change(countInput, { target: { value: '' } });
    expect(meetupInput).toHaveValue(params.meetup);
    expect(countInput).not.toHaveValue();
    expect(drawButton).toBeDisabled();

    // meetup: valid, count: valid
    fillOutForm();
    expect(meetupInput).toHaveValue(params.meetup);
    expect(countInput).toHaveValue(params.count);
    expect(drawButton).toBeEnabled();
  });
});
