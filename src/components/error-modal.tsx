"use client";

import { Button, Dialog, Flex, Text } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "./error-modal.module.css";

interface ErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message?: string;
  redirectTo?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export default function ErrorModal({
  open,
  onOpenChange,
  title = "System Error",
  message = "Something went wrong. Please try again.",
  redirectTo = "/",
  showRetry = false,
  onRetry,
  showHomeButton = true,
}: ErrorModalProps) {
  const router = useRouter();

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleNavigateHome = () => {
    handleClose();
    router.push(redirectTo);
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
    handleClose();
  };

  // Handle escape key (Radix handles this automatically, but we can add custom logic)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        // Custom escape logic if needed
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className={styles.dialogContent} maxWidth="500px">
        {/* CRT scanlines effect */}
        <div className={styles.scanlines}></div>

        {/* Error icon */}
        <Flex direction="column" align="center" gap="4">
          <div className={styles.errorIcon}>
            <div className={styles.errorSymbol}>⚠</div>
          </div>

          {/* Modal content */}
          <Flex
            direction="column"
            align="center"
            gap="3"
            className={styles.modalContent}
          >
            <Dialog.Title>
              <p className={styles.errorTitle}>{title}</p>
            </Dialog.Title>

            <Dialog.Description>
              <Text className={styles.errorMessage} size="3" align="center">
                {message}
              </Text>
            </Dialog.Description>
          </Flex>

          {/* Action buttons */}
          <Flex
            gap="3"
            wrap="wrap"
            justify="center"
            className={styles.modalActions}
          >
            {showRetry && onRetry && (
              <Button
                className={styles.retryButton}
                onClick={handleRetry}
                size="3"
              >
                <span className={styles.buttonIcon}>🔄</span>
                Retry
              </Button>
            )}

            {showHomeButton && (
              <Button
                className={styles.homeButton}
                onClick={handleNavigateHome}
                size="3"
              >
                <span className={styles.buttonIcon}>🏠</span>
                Go Home
              </Button>
            )}

            <Dialog.Close>
              <Button className={styles.closeButton} size="3">
                <span className={styles.buttonIcon}>✕</span>
                Close
              </Button>
            </Dialog.Close>
          </Flex>
        </Flex>

        {/* Glitch effect overlay */}
        <div className={styles.glitchOverlay}></div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
