import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface ImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string | null;
    altText?: string;
}

export function ImageModal({ isOpen, onClose, imageUrl, altText }: ImageModalProps) {
    if (!imageUrl) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none text-white">
                <DialogHeader className="sr-only">
                    <DialogTitle>Image Preview</DialogTitle>
                </DialogHeader>
                <div className="relative flex items-center justify-center w-full h-full min-h-[50vh] max-h-[90vh]">
                    {/* Close button overlap for convenience */}
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors pointer-events-auto z-50 text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    <img
                        src={imageUrl}
                        alt={altText || 'Preview'}
                        className="max-h-[85vh] w-auto max-w-full object-contain rounded-md shadow-2xl bg-black/20"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
