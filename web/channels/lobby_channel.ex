defmodule Stranger.LobbyChannel do
  @moduledoc ~S"""
  Any strangers in this channel are currently available to be paired with
  another stranger.
  """

  use Phoenix.Channel

  alias Stranger.{Lobby, Room}

  def join("lobby", join_msg, socket) do
    join("lobby", join_msg, socket, Lobby.all)
    {:ok, socket}
  end

  def join("lobby", _join_msg, socket, []) do
    Lobby.add(socket.assigns.stranger_id)
  end

  def join("lobby", _join_msg, socket, strangers) do
    strangers
    |> Enum.filter(&(&1 != socket.assigns.stranger_id))
    |> Enum.random()
    |> create_and_join_room(socket)
  end

  def terminate(_msg, socket) do
    Lobby.remove(socket.assigns.stranger_id)
  end

  defp join_room(name, id) do
    Stranger.Endpoint.broadcast! "strangers:#{id}",
                                 "join_room",
                                 %{topic: name}
  end

  defp leave_room(name, id) do
    Stranger.Endpoint.broadcast! "strangers:#{id}",
                                 "leave_room",
                                 %{topic: name}
  end

  defp create_and_join_room(nil, _socket), do: :ok
  defp create_and_join_room(stranger2, socket) do
    stranger1 = socket.assigns.stranger_id

    room_name = random_room_name()
    Room.create(room_name, stranger1, stranger2)

    leave_room("lobby", stranger1)
    leave_room("lobby", stranger2)

    join_room("rooms:#{room_name}", stranger1)
    join_room("rooms:#{room_name}", stranger2)
  end

  defp random_room_name() do
    Base.encode64(:crypto.strong_rand_bytes(32))
  end
end