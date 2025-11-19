import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const AlbumModal = ({ album, onClose }) => {
    if (!album) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-zinc-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-zinc-800"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold text-white truncate pr-4">{album.name}</h2>
                        <button onClick={onClose} className="text-zinc-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex gap-6">
                        <img
                            src={album.imageUrl}
                            alt={album.album}
                            className="w-40 h-40 rounded-lg shadow-lg object-cover"
                        />
                        <div className="flex flex-col justify-center space-y-2">
                            <p className="text-zinc-400 text-sm">Artist</p>
                            <p className="text-lg font-medium text-white">{album.artist}</p>

                            <p className="text-zinc-400 text-sm mt-2">Album</p>
                            <p className="text-white">{album.album}</p>

                            <div className="mt-4 flex items-center gap-2">
                                <div
                                    className="w-6 h-6 rounded-full border border-white/20"
                                    style={{ backgroundColor: album.color.hex }}
                                />
                                <span className="text-xs text-zinc-500 uppercase">{album.color.hex}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AlbumModal;
