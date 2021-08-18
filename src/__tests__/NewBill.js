import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import BillsUI from "../views/BillsUI.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES } from "../constants/routes";

import firebase from "../__mocks__/firebase.js";
import firestore from "../app/Firestore.js";

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

window.localStorage.setItem(
  "user",
  JSON.stringify({
    type: "Employee",
  })
);

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};

// TEST FORMULAIRE
describe("Given I am connected as an employee", () => {
  //Affichage formulaire
  describe("When I'm on NewBill page", () => {
    test("Then form should be displayed", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    });
  });
  // Test fonction handleSubmit
  describe("When I'm on NewBill page and click on submit btn", () => {
    test("Then the function handleSubmit should be called", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const newBill = new NewBill({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      });

      const form = document.querySelector(`form[data-testid="form-new-bill"]`);
      const handleSubmit = jest.fn(newBill.handleSubmit);
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});

// TEST FONCTION HANDLECHANGEFILE
describe("When I am an newBill page", () => {
  //Test appel de la fonction
  describe("When I add a file", () => {
    test("Then function hadleChangeFile should be called and input should be modified", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const newBill = new NewBill({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const file = screen.getByTestId("file");

      file.addEventListener("change", handleChangeFile);
      fireEvent.change(file, {
        target: {
          files: [new File(["text"], "text.txt", { type: "text/txt" })],
        },
      });
      expect(handleChangeFile).toHaveBeenCalled();
      expect(file.files[0].name).toBe("text.txt");
    });
  });
  // Test upload fichier ayant extension diff de jpg, jpeg ou png
  describe("When I add a file width a invalid extension", () => {
    test("THEN the error message should be displayed", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const newBill = new NewBill({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const file = screen.getByTestId("file");

      file.addEventListener("change", handleChangeFile);
      fireEvent.change(file, {
        target: {
          files: [new File(["texte.txt"], "texte.txt", { type: "texte/txt" })],
        },
      });

      expect(handleChangeFile).toHaveBeenCalled();
      expect(document.querySelector("#extension-error").style.display).toBe(
        "block"
      );
    });
  });
  // Test upload fichier ayant extension correcte
  describe("When I add a file width a valid extension", () => {
    test("THEN the error message shouldn't be displayed", () => {
      const firestore = {
        storage: {
          ref: jest.fn(() => {
            return {
              put: jest
                .fn()
                .mockResolvedValueOnce({ ref: { getDownloadURL: jest.fn() } }),
            };
          }),
        },
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage,
      });

      const html = NewBillUI();
      document.body.innerHTML = html;

      const file = screen.getByTestId("file");
      const handleChangeFile = newBill.handleChangeFile;
      file.addEventListener("change", handleChangeFile);
      fireEvent.change(file, {
        target: {
          files: [new File(["image"], "image.jpg", { type: "image/jpg" })],
        },
      });
      expect(file.files.length).toEqual(1);
      expect(document.querySelector("#extension-error").style.display).toBe(
        "none"
      );
    });
  });
});

//TEST D'INTEGRATION POST
describe("Given I am a user connected as Employee", () => {
  describe("When I post a bill", () => {
    test("number of bills fetched should be increased of 1", async () => {
      const postSpy = jest.spyOn(firebase, "post");
      const newBillForTest = {
        id: "ZeKy5Mo4jkmdfPGYpTxB",
        vat: "",
        amount: 180,
        name: "test integration post",
        fileName: "billtest",
        commentary: "note de frais pour test",
        pct: 20,
        type: " Services en ligne",
        email: "car@mail",
        fileUrl:
          "https://image.shutterstock.com/image-photo/beautiful-water-drop-on-dandelion-260nw-789676552.jpg",
        date: "2005-01-09",
        status: "pending",
        commentAdmin: "wait",
      };
      const allBills = await firebase.post(newBillForTest);
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(allBills.data.length).toBe(5);
    });

    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.post.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.post.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
