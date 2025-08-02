use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};
use std::mem::size_of;
use std::{thread};

use netstat2::{get_sockets_info, AddressFamilyFlags, ProtocolFlags, ProtocolSocketInfo, SocketInfo, TcpState};
use serde::{Deserialize, Serialize};
use serde_with::{serde_as, skip_serializing_none};
use specta::Type;
use sysinfo::{DiskUsage, Process, System};

use windows::{
    Win32::System::ProcessStatus::EnumProcesses,
    Win32::System::Threading::{OpenProcess, PROCESS_QUERY_INFORMATION, PROCESS_VM_READ, GetProcessTimes},
    Win32::Foundation::{FILETIME, CloseHandle},
};


use crate::error::Result;


#[skip_serializing_none]
#[serde_as]
#[derive(Type, Serialize, Deserialize, Clone, Debug)]
pub enum SockProtocol {
    Tcp,
    Udp,
}

impl From<&ProtocolSocketInfo> for SockProtocol {
    fn from(info: &ProtocolSocketInfo) -> Self {
        match info {
            ProtocolSocketInfo::Tcp(_) => Self::Tcp,
            ProtocolSocketInfo::Udp(_) => Self::Udp,
        }
    }
}

#[skip_serializing_none]
#[serde_as]
#[derive(Type, Serialize, Deserialize, Clone, Debug)]
pub enum SockState {
    Closed,
    Listen,
    SynSent,
    SynReceived,
    Established,
    FinWait1,
    FinWait2,
    CloseWait,
    Closing,
    LastAck,
    TimeWait,
    DeleteTcb,
    Unknown
}

impl From<&TcpState> for SockState {
    fn from(state: &TcpState) -> Self {
        match state {
            TcpState::Closed => {Self::Closed}
            TcpState::Listen => {Self::Listen}
            TcpState::SynSent => {Self::SynSent}
            TcpState::SynReceived => {Self::SynReceived}
            TcpState::Established => {Self::Established}
            TcpState::FinWait1 => {Self::FinWait1}
            TcpState::FinWait2 => {Self::FinWait2}
            TcpState::CloseWait => {Self::CloseWait}
            TcpState::Closing => {Self::Closing}
            TcpState::LastAck => {Self::LastAck}
            TcpState::TimeWait => {Self::TimeWait}
            TcpState::DeleteTcb => {Self::DeleteTcb}
            TcpState::Unknown => {Self::Unknown}
        }
    }
}

#[skip_serializing_none]
#[serde_as]
#[derive(Type, Serialize, Deserialize, Clone, Debug)]
pub struct SockInfo {
    local_addr: String,
    local_port: u16,
    protocol: SockProtocol,
    pids: Vec<u32>,
    remote_addr: Option<String>,
    remote_port: Option<u16>,
    state: Option<SockState>,
}

impl From<&SocketInfo> for SockInfo {
    fn from(sock_info: &SocketInfo) -> Self {
        let protocol = SockProtocol::from(&sock_info.protocol_socket_info);
        let (local_addr, local_port, remote_addr, remote_port, state) = match &sock_info.protocol_socket_info {
            ProtocolSocketInfo::Tcp(info) => {
                (
                    info.local_addr.to_string(),
                    info.local_port.clone(),
                    Some(info.remote_addr.to_string()),
                    Some(info.remote_port),
                    Some(SockState::from(&info.state))
                )
            }
            ProtocolSocketInfo::Udp(info) => {
                (
                    info.local_addr.to_string(),
                    info.local_port.clone(),
                    None,
                    None,
                    None
                )
            }
        };
        let pids = sock_info.associated_pids.clone();
        Self {
            local_addr,
            local_port,
            protocol,
            pids,
            remote_addr,
            remote_port,
            state,
        }

    }
}




#[skip_serializing_none]
#[serde_as]
#[derive(Type, Serialize, Deserialize, Clone, Debug, Default)]
pub struct ProcessInfo {
    pid: u32,
    ppid: Option<u32>,
    name: Option<String>,
    exe: Option<String>,
    cpu_usage: Option<f32>,
    memory: Option<u64>,
    disk_usage: Option<DiskInfo>,
    accumulated_cpu_time: Option<u64>,
    local_addr: Option<String>,
    local_port: Option<u16>,
    protocol: Option<SockProtocol>,
    remote_addr: Option<String>,
    remote_port: Option<u16>,
    state: Option<SockState>,
    uptime: Option<u64>,
}


#[skip_serializing_none]
#[serde_as]
#[derive(Type, Serialize, Deserialize, Clone, Debug)]
struct DiskInfo {
    read_bytes: u64,
    write_bytes: u64,
    total_read_bytes: u64,
    total_write_bytes: u64,
}

impl From<&DiskUsage> for DiskInfo {
    fn from(disk_usage: &DiskUsage) -> Self {
        Self {
            read_bytes: disk_usage.read_bytes,
            write_bytes: disk_usage.written_bytes,
            total_read_bytes: disk_usage.total_read_bytes,
            total_write_bytes: disk_usage.total_written_bytes,
        }
    }
}



fn make_process_info(process: &Process, socket_info: Option<&SockInfo>, uptime: Option<u64>) -> ProcessInfo {
    let pid = process.pid().as_u32();
    let name = Some(process.name().to_string_lossy().to_string());
    let exe = process.exe().map(|p|p.to_string_lossy().to_string());
    let cpu_usage = Some(process.cpu_usage());
    let memory = Some(process.memory());
    let disk_usage = Some(DiskInfo::from(&process.disk_usage()));
    let accumulated_cpu_time = Some(process.accumulated_cpu_time());
    let ppid = process.parent().map(|p| p.as_u32());
    let (
        local_addr, local_port, protocol, remote_addr, remote_port, state
    ) = match socket_info {
        Some(socket_info) => {
            (
                Some(socket_info.local_addr.clone()),
                Some(socket_info.local_port),
                Some(socket_info.protocol.clone()),
                socket_info.remote_addr.clone(),
                socket_info.remote_port.clone(),
                socket_info.state.clone(),
            )
        }
        None => (None, None, None, None, None, None)

    };

    ProcessInfo {
        pid,
        ppid,
        name,
        exe,
        cpu_usage,
        memory,
        disk_usage,
        accumulated_cpu_time,

        local_addr,
        local_port,
        protocol,
        remote_addr,
        remote_port,
        state,
        uptime
    }
}



pub fn get_processes_map() -> Result<HashMap<u32, ProcessInfo>> {
    let af_flags = AddressFamilyFlags::IPV4 | AddressFamilyFlags::IPV6;
    let proto_flags = ProtocolFlags::TCP | ProtocolFlags::UDP;
    let sockets_info = get_sockets_info(af_flags, proto_flags)?;
    let sockets: Vec<SockInfo> = sockets_info.iter().map(SockInfo::from).collect();
    let uptimes = get_process_uptime()?;

    let mut system = System::new_all();
    system.refresh_all();
    // thread::sleep(Duration::from_secs(1));
    // system.refresh_all();
    let processes = system.processes();

    let mut process_map: HashMap<u32, ProcessInfo> = processes.iter().map(|(k,v)| {
        let pid = k.as_u32();
        let find_socket = sockets.iter().find(|s| {
            s.pids.contains(&pid)
        });
        let find_uptime = uptimes.get(&pid).and_then(|u| u.uptime);

        (
            pid,
            make_process_info(v, find_socket, find_uptime)
        )
    }).collect();

    let pids: Vec<u32> = processes.keys().map(|k|k.as_u32()).collect();
    processes.iter().filter(|(_,v)| {
        if let Some(parent) = v.parent() {
            !pids.contains(&parent.as_u32())
        } else {
            false
        }
    }).for_each(|(_k, v)| {
        if let Some(parent) = v.parent() {
            let ppid = parent.as_u32();
            process_map.entry(ppid).or_insert(ProcessInfo {
                pid: ppid,
                ..ProcessInfo::default()
            });
        }
    });
    Ok(process_map)
    // Ok(process_map.into_iter().map(|(_,v)| v).collect())
}

pub fn get_processes() -> Result<Vec<ProcessInfo>> {
    let process_map = get_processes_map()?;
    let process_vec: Vec<ProcessInfo> = process_map.into_iter().map(|(_,v)| v).collect();
    // let mut process_vec: Vec<ProcessInfo> = process_map.into_iter().map(|(_,v)| v).collect();
    // process_vec.sort_by(|a, b| a.pid.cmp(&b.pid));

    Ok(process_vec)
}



#[skip_serializing_none]
#[serde_as]
#[derive(Type, Serialize, Deserialize, Clone, Debug)]
pub struct ProcessUptime {
    pid: u32,
    uptime: Option<u64>,
}

fn filetime_to_unix_epoch(ft: FILETIME) -> u64 {
    let high = (ft.dwHighDateTime as u64) << 32;
    let low = ft.dwLowDateTime as u64;
    let total = high | low;
    total / 10_000_000 - 11644473600
}
fn get_process_uptime() -> Result<HashMap<u32, ProcessUptime>> {
    let mut processes = [0u32; 1024];
    let mut cb_needed = 0;

    unsafe {EnumProcesses(
        processes.as_mut_ptr(),
        (processes.len() * size_of::<u32>()) as u32,
        &mut cb_needed,
    )}?;

    let num_processes = cb_needed as usize / size_of::<u32>();
    println!("num_processes: {}", num_processes);
    let mut processes_uptime = HashMap::new();
    for i in 0..num_processes {
        let pid = processes[i];
        let mut uptime = None;
        if pid == 0 {
            processes_uptime.insert(pid, ProcessUptime {
                pid,
                uptime,
            });
            continue;
        }
        println!("pid: {:?}", pid);

        let handle = match unsafe {OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, false, pid)} {
            Ok(handle) => handle,
            Err(e) => {
                println!("{:?}", e);
                processes_uptime.insert(pid, ProcessUptime {
                    pid,
                    uptime,
                });
                continue;
            }
        };
        if handle.is_invalid() {
            println!("handle is_invalid()");
            processes_uptime.insert(pid, ProcessUptime {
                pid,
                uptime,
            });
            continue;
        }

        let mut creation = FILETIME::default();
        let mut exit = FILETIME::default();
        let mut kernel = FILETIME::default();
        let mut user = FILETIME::default();

        if unsafe {GetProcessTimes(handle, &mut creation, &mut exit, &mut kernel, &mut user)}.is_ok() {
            let start_secs = filetime_to_unix_epoch(creation);
            let now_secs = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
            uptime = Some(now_secs - start_secs);
        }
        processes_uptime.insert(pid, ProcessUptime {
            pid,
            uptime,
        });

        unsafe {CloseHandle(handle)}?;
    }
    Ok(processes_uptime)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_processes() {
        assert!(matches!(get_processes(), Ok(_)));
    }

    #[test]
    fn test_get_process_uptime() {
        assert!(matches!(get_process_uptime(), Ok(_)));
    }
}