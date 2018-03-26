import React from 'react';
import { render, Simulate, flushPromises } from 'react-testing-library';
import mockAxios from 'axios';
import RaffleContainer from './RaffleContainer';

const mockWinners = Array.from(Array(2), (_, idx) => ({
  name: `Pickle Rick ${idx}`,
  photoURL: `https://i.imgur.com/3VhMoBD.png?i=${idx}`,
  profileURL: `https://en.wikipedia.org/wiki/Pickle_Rick?i=${idx}`,
}));

const params = {
  meetup: 'foo',
  count: 2,
  specificEventId: '',
  meetupApiKey: '',
};

describe('RaffleContainer', () => {
  const mockLocalStorage = global.window.localStorage; // from setupTests.js
  let container;
  let getByLabelText;
  let getByText;
  let getByTestId;

  const fillOutForm = () => {
    // find elements
    const meetupInput = getByLabelText(/Meetup name/);
    const countInput = getByLabelText('Number of winners:');

    // fill out form
    meetupInput.value = params.meetup;
    Simulate.change(meetupInput);
    countInput.value = params.count;
    Simulate.change(countInput);
  };

  const submitForm = async () => {
    const drawButton = getByText('Draw');

    // submit form
    // N.B. must simulate 'submit' here rather than 'click' because drawButton
    // does not have an onClick handler assigned explicitly
    Simulate.submit(drawButton);

    // wait for async stuff (like mocked Axios.get() Promise) to resolve
    await flushPromises();
  };

  beforeEach(() => {
    ({ container, getByLabelText, getByText, getByTestId } = render(
      <RaffleContainer />,
    ));
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  it('renders', () => {
    expect(container).toMatchSnapshot();
  });

  it('restores data from localStorage (if available)', () => {
    expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
    render(<RaffleContainer />);
    expect(mockLocalStorage.getItem).toHaveBeenCalled();
  });

  it('submits and persists data to localStorage (if available)', async () => {
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({ data: { winners: mockWinners } }),
    );

    expect(mockAxios.get).not.toHaveBeenCalled();
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

    fillOutForm();
    await submitForm();

    expect(mockLocalStorage.setItem).toHaveBeenCalled();
    expect(mockAxios.get).toHaveBeenCalledWith(expect.any(String), {
      params,
    });
  });

  it('shows an error message on error', async () => {
    const errorMessage = 'malformed response';
    mockAxios.get.mockImplementationOnce(() => Promise.resolve(errorMessage));

    fillOutForm();
    await submitForm();

    expect(getByText(errorMessage)).toBeTruthy();
  });

  it('resets the form on reset button click', async () => {
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({ data: { winners: mockWinners } }),
    );

    fillOutForm();
    await submitForm();

    expect(getByText(mockWinners[0].name)).toBeTruthy();
    Simulate.click(getByText('Reset'));
    expect(() => getByText(mockWinners[0].name)).toThrow();
  });

  it("doesn't crash if localStorage is unavailable", () => {
    global.window.localStorage = undefined;
    expect(() => render(<RaffleContainer />)).not.toThrow();
    // This next one isn't great - Jest will crash if the app throws.
    expect(async () => {
      fillOutForm();
      await submitForm();
    }).not.toThrow();
    global.window.localStorage = mockLocalStorage;
  });

  it('selects current meetup input text on focus', () => {
    const meetupInput = getByLabelText(/Meetup name/);

    expect(meetupInput.selectionStart).toBe(0);
    expect(meetupInput.selectionEnd).toBe(0);

    fillOutForm();
    Simulate.focus(meetupInput);

    expect(meetupInput.selectionStart).toBe(0);
    expect(meetupInput.selectionEnd).toBe(meetupInput.value.length);
  });

  it('toggles advanced options section', () => {
    const advancedButton = getByTestId('advanced-button');
    const advancedButtonIcon = getByTestId('advanced-button-icon');

    // This test isn't great. It would be better to somehow test visibility of
    // the advanced options, but because of how the Collapse component from
    // react-css-collapse works, they are in the DOM all the time and the only
    // thing that changes is the height of the containing element. At this time,
    // I haven't found a good way to assert true visibility.
    const collapsedIcon = advancedButtonIcon.textContent;
    Simulate.click(advancedButton);
    const expandedIcon = advancedButtonIcon.textContent;

    expect(collapsedIcon).not.toBe(expandedIcon);
  });

  it('selects current specific event ID input text on focus', () => {
    const specificEventIdInput = getByLabelText('Specific event ID');

    expect(specificEventIdInput.selectionStart).toBe(0);
    expect(specificEventIdInput.selectionEnd).toBe(0);

    specificEventIdInput.value = '12345';
    Simulate.change(specificEventIdInput);
    Simulate.focus(specificEventIdInput);

    expect(specificEventIdInput.selectionStart).toBe(0);
    expect(specificEventIdInput.selectionEnd).toBe(
      specificEventIdInput.value.length,
    );
  });

  it('selects current Meetup API key input text on focus', () => {
    const meetupApiKeyInput = getByLabelText('Meetup API key');

    expect(meetupApiKeyInput.selectionStart).toBe(0);
    expect(meetupApiKeyInput.selectionEnd).toBe(0);

    meetupApiKeyInput.value = '6a7b8c9d0e';
    Simulate.change(meetupApiKeyInput);
    Simulate.focus(meetupApiKeyInput);

    expect(meetupApiKeyInput.selectionStart).toBe(0);
    expect(meetupApiKeyInput.selectionEnd).toBe(meetupApiKeyInput.value.length);
  });
});