import "@testing-library/jest-dom/extend-expect";

// Basic mocks for next/image and next/navigation
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return require("react").createElement("img", props);
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Silence console.error in tests unless explicitly failing
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    const message = args[0] || "";
    if (typeof message === "string" && message.includes("Warning:")) {
      return;
    }
    originalError(...args);
  };
});
