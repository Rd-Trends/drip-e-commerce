import React, { Suspense } from 'react'
import type { User } from '@/payload-types'
import { JoinFieldServerProps } from 'payload'
import { ShimmerEffect } from '@payloadcms/ui'

const UsedByField = (props: JoinFieldServerProps) => {
  const value = (props.value || []) as Array<number | User>

  if (!value || value.length === 0) {
    return (
      <div className="field-type">
        <div className="label">
          <label>Used By</label>
        </div>
        <div className="field-type-description">
          <p>No users have used this coupon yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="field-type">
      <div className="label">
        <label>
          Used By ({value.length} {value.length === 1 ? 'user' : 'users'})
        </label>
      </div>
      <div className="field-type-description" style={{ marginBottom: '0.5rem' }}>
        <p>List of users who have used this coupon</p>
      </div>
      <Suspense fallback={<ShimmerEffect height={50} />}>
        <UsedBy payload={props.payload} value={value} />
      </Suspense>
    </div>
  )
}

const UsedBy = async ({
  payload,
  value,
}: Pick<JoinFieldServerProps, 'payload'> & { value: Array<number | User> }) => {
  const data = await payload.find({
    collection: 'users',
    where: {
      id: {
        in: value.filter((v): v is number => typeof v === 'number').map(String),
      },
    },
    limit: value.length,
  })

  const users = data.docs

  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '4px',
        padding: '1rem',
        maxHeight: '300px',
        overflowY: 'auto',
        backgroundColor: 'var(--theme-elevation-50)',
      }}
    >
      <ol
        style={{
          padding: 0,
          margin: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.5rem 1rem',
          listStylePosition: 'inside',
        }}
      >
        {users.map((user, index) => {
          const userData = typeof user === 'object' ? user : null
          const userId = typeof user === 'string' ? user : userData?.id
          const userEmail = userData?.email || 'Unknown user'
          const userName = userData?.name || null

          return (
            <li
              key={userId || index}
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  color: 'var(--theme-elevation-400)',
                  fontSize: '0.875rem',
                  flexShrink: 0,
                }}
              >
                {index + 1}.
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 500,
                    fontSize: '0.9375rem',
                    wordBreak: 'break-word',
                  }}
                >
                  {userName || userEmail}
                </div>
                {userName && (
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--theme-elevation-500)',
                      marginTop: '0.125rem',
                      wordBreak: 'break-word',
                    }}
                  >
                    {userEmail}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default UsedByField
