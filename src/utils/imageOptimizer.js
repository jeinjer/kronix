export const convertToWebP = (file, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            return reject(new Error('Formato no soportado. Solo JPG y PNG.'));
        }

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        return reject(new Error('Error en la compresión.'));
                    }
                    
                    const newName = file.name.replace(/\.(jpg|jpeg|png)$/i, '') + '.webp';
                    const newFile = new File([blob], newName, {
                        type: 'image/webp',
                        lastModified: Date.now(),
                    });

                    URL.revokeObjectURL(objectUrl);
                    resolve(newFile);
                },
                'image/webp',
                quality
            );
        };

        img.onerror = (err) => {
            URL.revokeObjectURL(objectUrl);
            reject(err);
        };

        img.src = objectUrl;
    });
};