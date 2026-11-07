import { useMemo } from "react";
import { createToaster, Toast, Toaster } from "@destyler-ui/react";
interface BasicProps {
  duration?: number;
}
export function Basic(props: BasicProps = {}) {
  const toaster = useMemo(
    () =>
      createToaster({
        placement: "bottom-end",
        overlap: true,
        gap: 24,
        duration: props.duration,
      }),
    [props.duration],
  );
  const createToast = () => {
    toaster.create({
      title: "Title",
      description: "Description",
      type: "info",
    });
  };
  return (
    <>
      <button type="button" onClick={createToast}>
        Create Toast
      </button>
      <Toaster toaster={toaster}>
        {(toast) => (
          <Toast.Root key={toast.id}>
            <Toast.Title>{toast.title}</Toast.Title>
            <Toast.Description>{toast.description}</Toast.Description>
            <Toast.ActionTrigger onClick={() => toaster.dismiss(toast.id)}>
              Action
            </Toast.ActionTrigger>
            <Toast.CloseTrigger aria-label="Close toast">×</Toast.CloseTrigger>
          </Toast.Root>
        )}
      </Toaster>
    </>
  );
}
