const CopyIcon =({ color = "#14142A" }: { color?: string }) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.3332 10.75V14.25C13.3332 17.1666 12.1665 18.3333 9.24984 18.3333H5.74984C2.83317 18.3333 1.6665 17.1666 1.6665 14.25V10.75C1.6665 7.83329 2.83317 6.66663 5.74984 6.66663H9.24984C12.1665 6.66663 13.3332 7.83329 13.3332 10.75Z"
        stroke={color}
        stroke-width="1.25"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M18.3332 5.74996V9.24996C18.3332 12.1666 17.1665 13.3333 14.2498 13.3333H13.3332V10.75C13.3332 7.83329 12.1665 6.66663 9.24984 6.66663H6.6665V5.74996C6.6665 2.83329 7.83317 1.66663 10.7498 1.66663H14.2498C17.1665 1.66663 18.3332 2.83329 18.3332 5.74996Z"
        stroke={color}
        stroke-width="1.25"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}

export default CopyIcon
