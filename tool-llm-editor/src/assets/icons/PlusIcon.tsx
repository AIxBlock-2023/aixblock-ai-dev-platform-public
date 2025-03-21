const PlusIcon = ({ width = 18, height = 18, color = "#5050FF" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M14.25 8.25H9.75V3.75C9.75 3.33525 9.414 3 9 3C8.586 3 8.25 3.33525 8.25 3.75V8.25H3.75C3.336 8.25 3 8.58525 3 9C3 9.41475 3.336 9.75 3.75 9.75H8.25V14.25C8.25 14.6648 8.586 15 9 15C9.414 15 9.75 14.6648 9.75 14.25V9.75H14.25C14.664 9.75 15 9.41475 15 9C15 8.58525 14.664 8.25 14.25 8.25Z"
        fill={color}
      />
    </svg>
  )
}

export default PlusIcon
