const images = import.meta.glob<{ default: string }>('./assets/images/*.jpg', { eager: true, query: '?url' });
console.log(images);
