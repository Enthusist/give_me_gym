import { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function App() {
  const [intervalSec, setIntervalSec] = useState(5);
  const [slot, setSlot] = useState(null);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("Idle");

  const timerRef = useRef(null);
  const lastState = useRef(false);

  const fetchSlot = async () => {
    try {
      const res = await axios.post(
        "https://campus-api.um6p.ma/api/prestation/timeslotes/8",
        new URLSearchParams({
          page: "2",
          date_start: "2026-05-05",
          date_end: "2026-05-05"
        }),
        {
          headers: {
            "User-Agent": "Dart/3.9 (dart:io)",
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vY2FtcHVzLWFwaS51bTZwLm1hL2FwaS9sb2dpbiIsImlhdCI6MTc3NzMyODgzMiwiZXhwIjoxNzc5OTIwODMyLCJuYmYiOjE3NzczMjg4MzIsImp0aSI6Ikxvcks2dlBEa3lobjBQN2MiLCJzdWIiOiI0NjM5IiwicHJ2IjoiODdlMGFmMWVmOWZkMTU4MTJmZGVjOTcxNTNhMTRlMGIwNDc1NDZhYSJ9.fS2H86fAxUK-mnIonIHNbgiqDnSU_Id_Vd58cB863IY"
          }
        }
      );

      const slots = res.data.data;
      const wanted = slots.find(s => s.id === 217132);

      if (!wanted) {
        setStatus("Slot not found");
        return;
      }

      setSlot(wanted);
      setStatus("Updated");

      if (wanted.canbook && !lastState.current) {
        notify("Slot is OPEN!");
        playSound();
      }

      lastState.current = wanted.canbook;

    } catch (err) {
      setStatus("Error fetching");
    }
  };

  const start = () => {
    stop();
    setRunning(true);

    fetchSlot();
    timerRef.current = setInterval(fetchSlot, intervalSec * 1000);
  };

  const stop = () => {
    setRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const notify = (msg) => {
    if (Notification.permission === "granted") {
      new Notification(msg);
    } else {
      Notification.requestPermission().then(p => {
        if (p === "granted") new Notification(msg);
      });
    }
  };

  const playSound = () => {
    const audio = new Audio("/alert.mp3");
    audio.play();
  };

  useEffect(() => {
    return () => stop();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>🎯 Slot Monitor (React Only)</h1>

      <div>
        <label>Interval (sec): </label>
        <input
          type="number"
          value={intervalSec}
          onChange={(e) => setIntervalSec(e.target.value)}
        />
      </div>

      <br />

      {!running ? (
        <button onClick={start}>Start</button>
      ) : (
        <button onClick={stop}>Stop</button>
      )}

      <h3>Status: {status}</h3>

      {slot && (
        <div
          style={{
            padding: 15,
            borderRadius: 10,
            background: slot.canbook ? "#c8f7c5" : "#f7c5c5",
            marginTop: 20
          }}
        >
          <p><b>Time:</b> {slot.time}</p>
          <p><b>Capacity:</b> {slot.capacity}</p>
          <p><b>Available:</b> {slot.canbook ? "YES" : "NO"}</p>
          <p><b>Waiting:</b> {slot.waiting_available}</p>
        </div>
      )}
    </div>
  );
}