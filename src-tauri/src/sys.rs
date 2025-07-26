use netstat::{get_sockets_info, AddressFamilyFlags, ProtocolFlags, ProtocolSocketInfo, SocketInfo, TcpState};
use serde::{Deserialize, Serialize};
use serde_with::{serde_as, skip_serializing_none};
use specta::Type;
use sysinfo::{DiskUsage, Process, ProcessesToUpdate, System};
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
}

impl From<&TcpState> for SockState {
    fn from(state: &TcpState) -> Self {
        match state {
            TcpState::Closed => Self::Closed,
            TcpState::Listen => Self::Listen,
            TcpState::SynSent => Self::SynSent,
            TcpState::SynReceived => Self::SynReceived,
            TcpState::Established => Self::Established,
            TcpState::FinWait1 => Self::FinWait1,
            TcpState::FinWait2 => Self::FinWait2,
            TcpState::CloseWait => Self::CloseWait,
            TcpState::Closing => Self::Closing,
            TcpState::LastAck => Self::LastAck,
            TcpState::TimeWait => Self::TimeWait,
            TcpState::DeleteTcb => Self::DeleteTcb,
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


pub fn get_sockets() -> Result<Vec<SockInfo>> {
    let af_flags = AddressFamilyFlags::IPV4 | AddressFamilyFlags::IPV6;
    let proto_flags = ProtocolFlags::TCP | ProtocolFlags::UDP;
    let sockets_info = get_sockets_info(af_flags, proto_flags)?;
    Ok(sockets_info.iter().map(SockInfo::from).collect())
}

#[skip_serializing_none]
#[serde_as]
#[derive(Type, Serialize, Deserialize, Clone, Debug)]
pub struct ProcessInfo {
    pid: u32,
    name: String,
    exe: Option<String>,
    cpu_usage: f32,
    memory: u64,
    disk_usage: DiskInfo,
    accumulated_cpu_time: u64,
    parent: Option<u32>,
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

impl From<&Process> for ProcessInfo {
    fn from(process: &Process) -> Self {
        let pid = process.pid().as_u32();
        let name = process.name().to_string_lossy().to_string();
        let exe = process.exe().map(|p|p.to_string_lossy().to_string());
        let cpu_usage = process.cpu_usage();
        let memory = process.memory();
        let disk_usage = DiskInfo::from(&process.disk_usage());
        let accumulated_cpu_time = process.accumulated_cpu_time();
        let parent = process.parent().map(|p| p.as_u32());
        Self {
            pid,
            name,
            exe,
            cpu_usage,
            memory,
            disk_usage,
            accumulated_cpu_time,
            parent,
        }
    }
}

pub fn get_processes() -> Result<Vec<ProcessInfo>> {
    let mut system = System::new();
    system.refresh_processes(ProcessesToUpdate::All, true);
    let ret: Vec<ProcessInfo> = system.processes().iter().map(|(_k,v)| {
        ProcessInfo::from(v)
    }).collect();
    Ok(ret)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_sockets() {
        println!("{:?}", get_sockets());
        assert!(matches!(get_sockets(), Ok(_)));
    }

    #[test]
    fn test_get_processes() {
        println!("{:?}", get_processes());
        assert!(matches!(get_processes(), Ok(_)));
    }
}