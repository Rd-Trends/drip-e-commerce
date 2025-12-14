import { deepMerge } from '@/utils/deep-merge'
import type { Field } from 'payload'

export type LinkAppearances = 'default' | 'outline'

export const appearanceOptions: Record<LinkAppearances, { label: string; value: string }> = {
  default: {
    label: 'Default',
    value: 'default',
  },
  outline: {
    label: 'Outline',
    value: 'outline',
  },
}

type LinkType = (options?: {
  appearances?: LinkAppearances[] | false
  disableLabel?: boolean
  overrides?: Record<string, unknown>
}) => Field

export const link: LinkType = ({ appearances, disableLabel = false, overrides = {} } = {}) => {
  const linkResult: Field = {
    name: 'link',
    type: 'group',
    admin: {
      hideGutter: true,
    },
    fields: [
      {
        type: 'row',
        fields: [
          ...(!disableLabel
            ? [
                {
                  name: 'label',
                  type: 'text',
                  admin: {
                    width: '50%',
                  },
                  label: 'Label',
                  required: true,
                } as Field,
              ]
            : []),
          {
            name: 'url',
            type: 'text',
            admin: {
              width: disableLabel ? '100%' : '50%',
            },
            label: 'URL',
            required: true,
          },
        ],
      },
      {
        name: 'newTab',
        type: 'checkbox',
        label: 'Open in new tab',
      },
    ],
  }

  if (appearances !== false) {
    let appearanceOptionsToUse = [appearanceOptions.default, appearanceOptions.outline]

    if (appearances) {
      appearanceOptionsToUse = appearances.map((appearance) => appearanceOptions[appearance])
    }

    linkResult.fields.push({
      name: 'appearance',
      type: 'select',
      admin: {
        description: 'Choose how the link should be rendered.',
      },
      defaultValue: 'default',
      options: appearanceOptionsToUse,
    })
  }

  return deepMerge(linkResult, overrides)
}
