"use client"

import { useEffect } from "react"

interface UserInfo {
  uuid: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  avatarUrl: string
}

export default function UserInfoLogger({ userInfo }: { userInfo: UserInfo }) {
  useEffect(() => {
    console.log("=== CLIENT: USER INFORMATION ===")
    console.log("UUID:", userInfo.uuid)
    console.log("Email:", userInfo.email)
    console.log("First Name:", userInfo.firstName)
    console.log("Last Name:", userInfo.lastName)
    console.log("Full Name:", userInfo.fullName)
    console.log("Avatar URL:", userInfo.avatarUrl)
    console.log("=================================")
  }, [userInfo])
  
  return null // This component doesn't render anything
}
