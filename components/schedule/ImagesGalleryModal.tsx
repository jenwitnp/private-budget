"use client";

import { Modal } from "@/components/ui/Modal";
import { ImagesGalleryContent } from "@/components/schedule/ImagesGalleryContent";
import type { Schedule } from "@/server/schedule.server";

interface ImagesGalleryModalProps {
  isOpen: boolean;
  schedule?: Schedule | null;
  onClose: () => void;
}

export function ImagesGalleryModal({
  isOpen,
  schedule,
  onClose,
}: ImagesGalleryModalProps) {
  if (!isOpen || !schedule) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="รูปภาพตารางงาน"
      icon="fa-images"
      size="lg"
      isLoading={!schedule}
    >
      <div className="max-h-[80vh] overflow-y-auto">
        <ImagesGalleryContent
          schedule={schedule as any}
          isLoading={!schedule}
          error={schedule ? null : new Error("Loading...")}
        />
      </div>
    </Modal>
  );
}
