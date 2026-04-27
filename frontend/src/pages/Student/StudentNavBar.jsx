import React from 'react'

function StudentNavBar() {
  return (
    <div className='bg-brickRed min-h-screen opacity-95 md:w-[18rem] w-[12rem] md:p-14 p-10 flex flex-col gap-10'>
        <div className='text-white font-semibold text-xl mt-10'>Dashboard</div>
        <div className='text-white font-semibold text-xl'>All Projects</div>
        <div className='text-white font-semibold text-xl'>Profile</div>
    </div>
  )
}

export default StudentNavBar