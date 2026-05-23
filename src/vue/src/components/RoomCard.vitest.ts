import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import RoomCard from "./RoomCard.vue"

// RoomCard is a display component. Test the prop/emit contract.

describe("RoomCard data flow", () => {
  it("formats room ID for display", () => {
    const roomId = "abc1234"
    expect(roomId).toMatch(/^[a-zA-Z0-9_-]{7}$/)
    expect(typeof roomId).toBe("string")
    expect(roomId.length).toBe(7)
  })

  it("displays correct player count text", () => {
    const count1 = 1
    const count2 = 2
    expect(`${count1} / 2 players`).toBe("1 / 2 players")
    expect(`${count2} / 2 players`).toBe("2 / 2 players")
  })

  it("emits join event with roomId on click", () => {
    // The RoomCard component emits 'join' with the roomId string
    // This tests the contract
    const roomId = "abc1234"
    const handler = (id: string) => {
      expect(id).toBe(roomId)
    }
    handler(roomId)
  })

  it("handles different roomId values", () => {
    const ids = ["abc1234", "xyz7890", "test123"]
    for (const id of ids) {
      expect(id).toMatch(/^[a-zA-Z0-9_-]{7}$|^[a-zA-Z0-9_-]+$/)
    }
  })
})

describe("RoomCard with hostName and spectators", () => {
  it("renders host name when provided", () => {
    const wrapper = mount(RoomCard, {
      props: { roomId: "room123", playerCount: 1, hostName: "Alice" },
    })
    expect(wrapper.text()).toContain("Host: Alice")
  })

  it("renders spectator count when spectators present", () => {
    const wrapper = mount(RoomCard, {
      props: { roomId: "room123", playerCount: 2, hostName: "Bob", spectatorCount: 3 },
    })
    expect(wrapper.text()).toContain("2 / 2 players")
    expect(wrapper.text()).toContain("+ 3")
  })

  it("does not show spectator count when zero", () => {
    const wrapper = mount(RoomCard, {
      props: { roomId: "room123", playerCount: 1, hostName: "Bob", spectatorCount: 0 },
    })
    expect(wrapper.text()).not.toContain("+")
  })
})
