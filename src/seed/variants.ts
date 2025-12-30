const colorVariant = {
  name: 'color',
  label: 'Color',
  options: [
    { label: 'Black', value: 'black' },
    { label: 'White', value: 'white' },
    { label: 'Navy', value: 'navy' },
    { label: 'Gray', value: 'gray' },
    { label: 'Blue', value: 'blue' },
    { label: 'Red', value: 'red' },
    { label: 'Green', value: 'green' },
    { label: 'Brown', value: 'brown' },
    { label: 'Beige', value: 'beige' },
    { label: 'Khaki', value: 'khaki' },
    { label: 'Burgundy', value: 'burgundy' },
    { label: 'Olive', value: 'olive' },
  ],
}

// General clothing sizes (for shirts, polos, hoodies, jackets, jerseys)
const sizeVariant = {
  name: 'size',
  label: 'Clothing Size',
  options: [
    { label: 'XS', value: 'xs' },
    { label: 'S', value: 's' },
    { label: 'M', value: 'm' },
    { label: 'L', value: 'l' },
    { label: 'XL', value: 'xl' },
    { label: 'XXL', value: 'xxl' },
  ],
}

// Waist sizes (for jeans, shorts, belts)
const waistSizeVariant = {
  name: 'waist-size',
  label: 'Waist Size',
  options: [
    { label: '28', value: '28' },
    { label: '30', value: '30' },
    { label: '32', value: '32' },
    { label: '34', value: '34' },
    { label: '36', value: '36' },
    { label: '38', value: '38' },
    { label: '40', value: '40' },
    { label: '42', value: '42' },
  ],
}

// Shoe/Sneaker sizes
const shoeSizeVariant = {
  name: 'shoe-size',
  label: 'Shoe Size',
  options: [
    { label: '40', value: '40' },
    { label: '41', value: '41' },
    { label: '42', value: '42' },
    { label: '43', value: '43' },
    { label: '44', value: '44' },
    { label: '45', value: '45' },
    { label: '46', value: '46' },
  ],
}

// Cap sizes
const capSizeVariant = {
  name: 'cap-size',
  label: 'Cap Size',
  options: [
    { label: 'One Size', value: 'one-size' },
    { label: 'S/M', value: 's-m' },
    { label: 'L/XL', value: 'l-xl' },
  ],
}

// Bag sizes
const bagSizeVariant = {
  name: 'bag-size',
  label: 'Bag Size',
  options: [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' },
  ],
}

const materialVariant = {
  name: 'material',
  label: 'Material',
  options: [
    { label: 'Cotton', value: 'cotton' },
    { label: 'Polyester', value: 'polyester' },
    { label: 'Denim', value: 'denim' },
    { label: 'Leather', value: 'leather' },
    { label: 'Canvas', value: 'canvas' },
    { label: 'Suede', value: 'suede' },
    { label: 'Nylon', value: 'nylon' },
  ],
}

const fitVariant = {
  name: 'fit',
  label: 'Fit',
  options: [
    { label: 'Slim Fit', value: 'slim-fit' },
    { label: 'Regular Fit', value: 'regular-fit' },
    { label: 'Relaxed Fit', value: 'relaxed-fit' },
    { label: 'Oversized', value: 'oversized' },
  ],
}

export const variantsSeedData = [
  colorVariant,
  sizeVariant,
  waistSizeVariant,
  shoeSizeVariant,
  capSizeVariant,
  bagSizeVariant,
  materialVariant,
  fitVariant,
]
