const colorVariant = {
  name: 'color',
  label: 'Color',
  options: [
    { label: 'Red', value: 'red' },
    { label: 'Blue', value: 'blue' },
    { label: 'Black', value: 'black' },
    { label: 'White', value: 'white' },
    { label: 'Green', value: 'green' },
    { label: 'Yellow', value: 'yellow' },
    { label: 'Pink', value: 'pink' },
    { label: 'Purple', value: 'purple' },
    { label: 'Orange', value: 'orange' },
    { label: 'Gray', value: 'gray' },
    { label: 'Brown', value: 'brown' },
  ],
}

const sizeVariant = {
  name: 'size',
  label: 'Size',
  options: [
    { label: 'XS', value: 'xs' },
    { label: 'S', value: 's' },
    { label: 'M', value: 'm' },
    { label: 'L', value: 'l' },
    { label: 'XL', value: 'xl' },
    { label: 'XXL', value: 'xxl' },
  ],
}

const materialVariant = {
  name: 'material',
  label: 'Material',
  options: [
    { label: 'Cotton', value: 'cotton' },
    { label: 'Polyester', value: 'polyester' },
    { label: 'Leather', value: 'leather' },
    { label: 'Denim', value: 'denim' },
    { label: 'Silk', value: 'silk' },
    { label: 'Wool', value: 'wool' },
  ],
}

const styleVariant = {
  name: 'style',
  label: 'Style',
  options: [
    { label: 'Classic', value: 'classic' },
    { label: 'Casual', value: 'casual' },
    { label: 'Sporty', value: 'sporty' },
    { label: 'Formal', value: 'formal' },
    { label: 'Streetwear', value: 'streetwear' },
  ],
}

export const variantsSeedData = [colorVariant, sizeVariant, materialVariant, styleVariant]
