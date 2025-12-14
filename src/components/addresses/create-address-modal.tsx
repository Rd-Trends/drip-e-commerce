'use client'
import { AddressForm } from './address-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Address } from '@/payload-types'
import { DefaultDocumentIDType } from 'payload'
import React, { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

type Props = {
  addressID?: DefaultDocumentIDType
  initialData?: Partial<Omit<Address, 'country'>> & { country?: string }
  buttonText?: string
  modalTitle?: string
  callback?: (address: Partial<Address>) => void
  skipSubmission?: boolean
  disabled?: boolean
}

export const CreateAddressModal: React.FC<Props> = ({
  addressID,
  initialData,
  buttonText = 'Add a new address',
  modalTitle = 'Add a new address',
  callback,
  skipSubmission,
  disabled,
}) => {
  const [open, setOpen] = useState(false)
  const handleOpenChange = (state: boolean) => {
    setOpen(state)
  }

  const closeModal = () => {
    setOpen(false)
  }

  const handleCallback = (data: Partial<Address>) => {
    closeModal()

    if (callback) {
      callback(data)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild disabled={disabled}>
        <Button variant={'outline'}>{buttonText}</Button>
      </DialogTrigger>
      <DialogContent className="p-0">
        <ScrollArea className="h-[80lvh] p-4 md:p-10">
          <DialogHeader className="pb-4 md:pb-6">
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>This address will be connected to your account.</DialogDescription>
          </DialogHeader>

          <AddressForm
            addressID={addressID}
            initialData={initialData}
            callback={handleCallback}
            skipSubmission={skipSubmission}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
