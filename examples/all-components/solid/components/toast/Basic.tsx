import { createToaster, Toast, Toaster } from "@destyler-ui/solid/toast";
import { XIcon } from "../../icons";
export function Basic() {
  const toaster = createToaster({
    placement: "bottom-end",
    gap: 24,
  });
  return (
    <div>
      <button
        type="button"
        onClick={() =>
          toaster.create({
            title: "Title",
            description: "Description",
            type: "info",
          })
        }
      >
        Create Toast
      </button>
      <Toaster toaster={toaster}>
        {(toast) => (
          <Toast.Root>
            <Toast.Title>{toast().title}</Toast.Title>
            <Toast.Description>{toast().description}</Toast.Description>
            <Toast.ActionTrigger onClick={() => toaster.dismiss(toast().id)}>
              Action
            </Toast.ActionTrigger>
            <Toast.CloseTrigger aria-label="Close toast">
              <XIcon />
            </Toast.CloseTrigger>
          </Toast.Root>
        )}
      </Toaster>
    </div>
  );
}
