import { screen } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import userEvent from "@testing-library/user-event";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import firebase from "../__mocks__/firebase.js";
import firestore from "../app/Firestore.js";
import Router from "../app/Router.js";

Object.defineProperty(window, "localStorage", { value: localStorageMock });
window.localStorage.setItem(
  "user",
  JSON.stringify({
    type: "Employee",
  })
);

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};

// TESTS BILLS PAGE AFFICHAGES
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    //test icone bills
    test("Then bills icon in vertical layout should exist and should be highlighted", () => {
      firestore.bills = () => ({
        get: jest.fn().mockResolvedValueOnce((bi) => bi(bills)),
      });
      Object.defineProperty(window, "location", {
        value: { hash: ROUTES_PATH["Bills"] },
      });
      document.body.innerHTML = `<div id="root"></div>`;
      Router();
      expect(screen.getByTestId("icon-window")).toBeTruthy;
      expect(
        screen.getByTestId("icon-window").classList.contains("active-icon")
      ).toBeTruthy();
    });

    //test icone mail
    test("Then email icon in vertical layout should exist and not be highlighted", () => {
      firestore.bills = () => ({
        get: jest.fn().mockResolvedValueOnce((bi) => bi(bills)),
      });
      Object.defineProperty(window, "location", {
        value: { hash: ROUTES_PATH["Bills"] },
      });
      document.body.innerHTML = `<div id="root"></div>`;
      Router();

      expect(screen.getByTestId("icon-mail")).toBeTruthy;
      expect(
        screen.getByTestId("icon-mail").classList.contains("active-icon")
      ).not.toBeTruthy();
    });

    // Test présence d'icone eye
    describe("When I am on Bills Page and there is bill", () => {
      test("Then there is Icon Eye btn", () => {
        firestore.bills = () => ({
          get: jest.fn().mockResolvedValueOnce((bi) => bi(bills)),
        });
        Object.defineProperty(window, "location", {
          value: { hash: ROUTES_PATH["Bills"] },
        });
        document.body.innerHTML = `<div id="root"></div>`;
        Router();
        expect(
          document.querySelectorAll(`div[data-testid="icon-eye"]`)
        ).toBeTruthy();
      });

      // Test affichage liste des notes de frais
      test("Then my page is displayed", () => {
        document.body.innerHTML = BillsUI({ data: bills });
        expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
      });

      // Test ordre d'affichage notes de frais
      test("Then bills should be ordered from earliest to latest", () => {
        const html = BillsUI({ data: bills });
        document.body.innerHTML = html;
        const dates = screen
          .getAllByText(
            /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
          )
          .map((a) => a.innerHTML);
        const antiChrono = (a, b) => (a < b ? 1 : -1);
        const datesSorted = [...dates].sort(antiChrono);
        expect(dates).toEqual(datesSorted);
      });
    });
  });

  // TEST FONCTION CREATION NEW BILL
  describe("When I am on Bills page and I click on New Bill button", () => {
    //Test appel de la fonction ouverture de form
    test("Then function handleClickNewBill is called", () => {
      const bill = new Bills({
        document,
        onNavigate,
        firestore: null,
        bills,
        localStorage: window.localStorage,
      });
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;

      const handleClickNewBill = jest.fn((e) => bill.handleClickNewBill(e));
      const btn = screen.getByTestId("btn-new-bill");
      btn.addEventListener("click", handleClickNewBill);
      userEvent.click(btn);
      expect(handleClickNewBill).toHaveBeenCalled();
    });
    // Test affichage du formulaire
    test("Then new Bill form should be displayed", () => {
      const bill = new Bills({
        document,
        onNavigate,
        firestore: null,
        bills,
        localStorage: window.localStorage,
      });
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;

      const handleClickNewBill = (e) => bill.handleClickNewBill(e);
      const button = screen.getByTestId("btn-new-bill");
      button.addEventListener("click", handleClickNewBill);
      userEvent.click(button);
      const title = screen.getAllByText("Envoyer une note de frais");
      expect(title).toBeTruthy();
    });
  });

  // TEST FONCTION HANDLECLICKICONEYE
  describe("When I am on Bills page and I click on Icon Eye button", () => {
    //Test appel de la fonction
    test("Then function handleClickIconEye is called", () => {
      const bill = new Bills({
        document,
        onNavigate,
        firestore: null,
        bills,
        localStorage: window.localStorage,
      });
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;

      $.fn.modal = jest.fn();

      const iconEye = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye = jest.fn(() => {
        bill.handleClickIconEye(iconEye);
      });
      iconEye.addEventListener("click", handleClickIconEye);
      userEvent.click(iconEye);
      expect(handleClickIconEye).toBeCalled();
    });
  });
  // Test ouverture de la modale
  test("Then a modal should be opened", () => {
    const bill = new Bills({
      document,
      onNavigate,
      firestore: null,
      bills,
      localStorage: window.localStorage,
    });
    const html = BillsUI({ data: bills });
    document.body.innerHTML = html;

    $.fn.modal = jest.fn();

    const iconEye = screen.getAllByTestId("icon-eye")[0];
    iconEye.addEventListener("click", () => bill.handleClickIconEye(iconEye));
    userEvent.click(iconEye);
    expect($.fn.modal).toHaveBeenCalled();

    expect(document.querySelector("#modaleFile")).toBeTruthy();
    expect(
      document.querySelector("#modaleFile").getAttribute("style")
    ).not.toBe("display: none;");
  });
  // Test sources justif
  test("Then the image source attribute should be the same as icon data-bill-url attribute", () => {
    const bill = new Bills({
      document,
      onNavigate,
      firestore: null,
      bills,
      localStorage: window.localStorage,
    });
    const html = BillsUI({ data: bills });
    document.body.innerHTML = html;

    $.fn.modal = jest.fn();

    const iconEye = screen.getAllByTestId("icon-eye")[0];
    iconEye.addEventListener("click", () => bill.handleClickIconEye(iconEye));
    userEvent.click(iconEye);

    const billImgUrl = iconEye.getAttribute("data-bill-url");
    const img = document.querySelector(".modal-body img");
    const imgSource = img.getAttribute("src");
    expect(billImgUrl).toEqual(imgSource);
  });
  // Test message si attribut nul
  test("Then, data-bill-url attribute is null modal should open with a message", () => {
    const bill = new Bills({
      document,
      onNavigate,
      firestore: null,
      bills,
      localStorage: window.localStorage,
    });
    const html = BillsUI({ data: bills });
    document.body.innerHTML = html;

    $.fn.modal = jest.fn();

    const iconEye = screen.getAllByTestId("icon-eye")[0];
    iconEye.setAttribute("data-bill-url", "null");
    iconEye.addEventListener("click", () => bill.handleClickIconEye(iconEye));
    userEvent.click(iconEye);
    expect(screen.getAllByText("Absence de justificatif")).toBeTruthy();
  });
});

//TEST D'INTEGRATION GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bill employee'page", () => {
    test("fetches bills from mock API GET", async () => {
      const getSpy = jest.spyOn(firebase, "get");
      const bills = await firebase.get();
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(bills.data.length).toBe(4);
    });
    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
